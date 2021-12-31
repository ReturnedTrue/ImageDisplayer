#![allow(unused_parens)]

mod constants;

use constants::{FILE_NAME, FILE_PATH};
use image::{open as open_image, GenericImageView};
use serde::Serialize;
use std::cmp;
use std::fs;
use std::path::Path;
use std::sync::Arc;
use std::thread;
use std::time::SystemTime;

type PixelVec = Vec<JSONImagePixel>;
type PixelData = Vec<PixelVec>;

type ImageThreadVec = Vec<(u32, u32, JSONImagePixel)>;
type ImageThreadHandle = thread::JoinHandle<ImageThreadVec>;

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
		};
	}

	pub fn set_pixel(&mut self, x: usize, y: usize, pixel: JSONImagePixel) {
		self.pixels[x][y] = pixel;
	}
}

fn path_exists(path: &str) -> bool {
	return Path::new(path).exists();
}

fn to_roblox_transparency(alpha: u8) -> f32 {
	let float_transparency = (alpha as f32) / 255.0;
	let roblox_transparency = (float_transparency - 1.0).abs();

	return roblox_transparency;
}

fn render_image_factory(
	thread_start: u32,
	thread_end: u32,
	img_y: u32,
	img_arc: Arc<image::DynamicImage>,
) -> Box<dyn Fn() -> ImageThreadVec + Send> {
	let thread_vec_size = (thread_end - thread_start) * img_y;
	
	return Box::new(move || {
		let mut thread_vec: ImageThreadVec = Vec::with_capacity(thread_vec_size as usize);

		for x in thread_start..thread_end {
			for y in 0..img_y {
				let rgba = img_arc.get_pixel(x, y);
				let roblox_transparency = to_roblox_transparency(rgba[3]);

				let encoded_pixel = JSONImagePixel(rgba[0], rgba[1], rgba[2], roblox_transparency);

				thread_vec.push((x, y, encoded_pixel));
			}
		}

		return thread_vec;
	});
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

	let mut handles: Vec<ImageThreadHandle> = Vec::with_capacity(amount_of_threads);

	for thread_start in (0..img_x).step_by(x_per_thread as usize) {
		let cloned_img_arc = Arc::clone(&img_arc);
		let thread_end = cmp::min(thread_start + x_per_thread, img_x);

		let render_function = render_image_factory(thread_start, thread_end, img_y, cloned_img_arc);

		handles.push(thread::spawn(render_function));
	}

	for handle in handles {
		let thread_vec = handle.join().unwrap();

		for (x, y, pixel) in thread_vec {
			encoded_img.set_pixel(x as usize, y as usize, pixel);
		}
	}

	let serialized = serde_json::to_string(&encoded_img)?;
	let output_file = String::from(FILE_PATH) + FILE_NAME + ".json";

	if (path_exists(&output_file)) {
		fs::remove_file(&output_file)?;
	}

	fs::write(&output_file, serialized)?;

	let time_taken = start.elapsed()?;
	println!(
		"Wrote to: {}\nTime taken: {}ms",
		&output_file,
		time_taken.as_millis()
	);

	return Ok(());
}
