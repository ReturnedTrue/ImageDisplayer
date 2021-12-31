type ImagePixel = [number, number, number, number];

export interface ImageData {
	dimensions: [number, number];
	pixels: Array<Array<ImagePixel>>;
}
