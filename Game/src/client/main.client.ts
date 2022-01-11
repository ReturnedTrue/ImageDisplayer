import { UserInputService, Workspace, RunService } from "@rbxts/services";
import { remotes } from "shared/remotes";
import { ImageData } from "types/ImageData";

const RENDER_AT_EVERY_COLUMN = 100;

function partIsTheSame(part: BasePart, transparency: number, color: Color3) {
	return part.Transparency === transparency && part.Color === color;
}

function constructParts(imageData: ImageData) {
	const partsConstructed = [];

	const part = new Instance("Part");
	part.CanCollide = false;
	part.CanTouch = false;
	part.CastShadow = false;
	part.Anchored = true;
	part.Size = new Vector3(1, 1, 1);

	const xIncrease = new Vector3(part.Size.X, 0, 0);

	for (let x = 0; x < imageData.dimensions[0]; x++) {
		partsConstructed[x] = new Array<Part>();

		for (let y = 0; y < imageData.dimensions[1]; y++) {
			const pixel = imageData.pixels[x][y];
			const [red, green, blue, alpha] = pixel;

			if (alpha === 1) {
				continue;
			}

			const constructedColor = Color3.fromRGB(red, green, blue);
			const adjacentPart = x > 0 && partsConstructed[x - 1][y];

			if (adjacentPart && partIsTheSame(adjacentPart, alpha, constructedColor)) {
				adjacentPart.Size = adjacentPart.Size.add(xIncrease);
				adjacentPart.Position = adjacentPart.Position.add(xIncrease.div(2));

				partsConstructed[x][y] = adjacentPart;
				continue;
			}

			const pixelPart = part.Clone();
			pixelPart.Transparency = alpha;
			pixelPart.Color = constructedColor;
			pixelPart.Position = new Vector3(x, -y + imageData.dimensions[1], 0);

			partsConstructed[x][y] = pixelPart;
		}
	}

	return partsConstructed;
}

function renderParts(imageData: ImageData, partsConstructed: Array<Array<Part>>) {
	let amountRendered = 0;

	for (let x = 0; x < imageData.dimensions[0]; x++) {
		for (let y = 0; y < imageData.dimensions[1]; y++) {
			const part = partsConstructed[x][y];

			if (!part.Parent) {
				part.Parent = Workspace;
				amountRendered += 1;
			}
		}

		if (x % RENDER_AT_EVERY_COLUMN === 0) {
			RunService.Heartbeat.Wait();
		}
	}

	return amountRendered;
}

UserInputService.MouseIconEnabled = false;

task.wait(2);
const { name, data } = remotes.Client.Get("GetImage").CallServer();

task.wait(5);
const partsConstructed = constructParts(data);

task.wait(1);
const amountRendered = renderParts(data, partsConstructed);

task.wait(1);
print("Successfully rendered image:", name);
print("-".rep(20));
print("Amount normally needed:", data.dimensions[0] * data.dimensions[1]);
print("Amount rendered:", amountRendered);
