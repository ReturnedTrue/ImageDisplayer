#![allow(unused_parens)]

mod constants;

use std::fs;
use std::thread;
use std::cmp;
use std::sync::Arc;
use std::path::Path;
use std::time::SystemTime;
use constants::{FILE_NAME, FILE_PATH};
use image::{open as open_image, GenericImageView};
use serde::Serialize;

type PixelVec = Vec<JSONImagePixel>;
type PixelData = Vec<PixelVec>;

#[derive(Serialize, Debug)]
struct JSONImagePixel(u8, u8, u8, f32);

#[derive(Serialize)]
struct JSONImageData {
	dimensions: [usize; 2],
	pixels: PixelData,
}

impl JSONImageData {
	pub fn new(x: usize, y: usize) -> JSONImageData {
		let mut x_vec = Vec::with_capacity(x);

		for _ in 0..x {
			let mut y_vec: PixelVec = Vec::with_capacity(y);

			unsafe {
				y_vec.set_len(y);
			}
			
			x_vec.push(y_vec);
		}

		return JSONImageData {
			dimensions: [x, y],
			pixels: x_vec,
		}
	}

	pub fn set_pixel(&mut self, x: usize, y: usize, pixel: JSONImagePixel) {
		self.pixels[x][y] = pixel;
	}
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
	let start = SystemTime::now();

	let full = String::from(FILE_PATH) + FILE_NAME + ".png";

	let img = open_image(full)?;
	let (img_x, img_y) = img.dimensions();

	let mut encoded_img = JSONImageData::new(img_x as usize, img_y as usize);

	let img_arc = Arc::new(img);
	
	let amount_of_threads = 10;
	let x_per_thread = img_x / 10;
	let thread_vec_size = x_per_thread * img_y;

	let mut handles: Vec<thread::JoinHandle<Vec<(u32, u32, JSONImagePixel)>>> = Vec::with_capacity(amount_of_threads);

	for thread_start in (0..img_x).step_by(x_per_thread as usize) {
		let cloned_img_arc = Arc::clone(&img_arc);

		let handle = thread::spawn(move || {
			let thread_end = cmp::min(thread_start + x_per_thread, img_x);

			let mut thread_vec = Vec::with_capacity(thread_vec_size as usize);

			for x in thread_start..thread_end {
				for y in 0..img_y {
					let rgba = cloned_img_arc.get_pixel(x, y);

					let float_transparency = (rgba[3] as f32) / 255.0;
					let true_transparency = (float_transparency - 1.0).abs();

					let encoded_pixel = JSONImagePixel(rgba[0], rgba[1], rgba[2], true_transparency);
					thread_vec.push((x, y, encoded_pixel));
				}
			}

			return thread_vec;
		});

		handles.push(handle);
	}

	for handle in handles {
		let thread_vec = handle.join().unwrap();

		for (x, y, pixel) in thread_vec {
			encoded_img.set_pixel(x as usize, y as usize, pixel);
		}
	}

	let serialized = serde_json::to_string(&encoded_img)?;
	let output_file = String::from(FILE_PATH) + FILE_NAME + ".json";

	if (Path::new(&output_file).exists()) {
		fs::remove_file(&output_file)?;
	}

	fs::write(&output_file, serialized)?;

	let time_taken = start.elapsed()?;
	println!("Wrote to: {}\nTime taken: {}ms", &output_file, time_taken.as_millis());

	return Ok(());
}