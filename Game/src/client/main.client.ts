import { UserInputService, Workspace, RunService } from "@rbxts/services";
import { remotes } from "shared/remotes";

const RENDER_AT_EVERY_COLUMN = 100;

task.wait(2);
const { name, data } = remotes.Client.Get("GetImage").CallServer();
const [imageX, imageY] = data.dimensions;

const part = new Instance("Part");
part.CanCollide = false;
part.CanTouch = false;
part.CastShadow = false;
part.Anchored = true;
part.Size = new Vector3(1, 1, 1);

const x_increase = new Vector3(part.Size.X, 0, 0);

task.wait(5);
UserInputService.MouseIconEnabled = false;

const partsRendered = [];

function partIsTheSame(part: BasePart, transparency: number, color: Color3) {
	return part.Transparency === transparency && part.Color === color;
}

for (let x = 0; x < imageX; x++) {
	partsRendered[x] = new Array<Part>();

	for (let y = 0; y < imageY; y++) {
		const pixel = data.pixels[x][y];
		const [r, g, b, a] = pixel;

		if (a === 1) {
			continue;
		}

		const constructedColor = Color3.fromRGB(r, g, b);
		const adjacentPart = x > 0 && partsRendered[x - 1][y];

		if (adjacentPart && partIsTheSame(adjacentPart, a, constructedColor)) {
			adjacentPart.Size = adjacentPart.Size.add(x_increase);
			adjacentPart.Position = adjacentPart.Position.add(x_increase.div(2));

			partsRendered[x][y] = adjacentPart;
			continue;
		}

		const pixelPart = part.Clone();
		pixelPart.Transparency = a;
		pixelPart.Color = constructedColor;
		pixelPart.Position = new Vector3(x, -y + imageY, 0);

		partsRendered[x][y] = pixelPart;
	}
}

task.wait(1);

let amountRendered = 0;

for (let x = 0; x < imageX; x++) {
	for (let y = 0; y < imageY; y++) {
		const part = partsRendered[x][y];

		if (!part.Parent) {
			part.Parent = Workspace;
			amountRendered += 1;
		}
	}

	if (x % RENDER_AT_EVERY_COLUMN === 0) {
		RunService.Heartbeat.Wait();
	}
}

task.wait(1);

print("Successfully rendered image:", name);
print("-".rep(20));
print("Amount normally needed:", imageX * imageY);
print("Amount rendered:", amountRendered);
