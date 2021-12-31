import { UserInputService, Workspace, RunService } from "@rbxts/services";
import { remotes } from "shared/remotes";

task.wait(2);
const image = remotes.Client.Get("GetImage").CallServer();

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
let amountRendered = 0;
let columnCounter = 0;

const start = os.clock();

for (let x = 0; x < image.dimensions[0]; x++) {
	partsRendered[x] = new Array<Part>();

	for (let y = 0; y < image.dimensions[1]; y++) {
		const pixel = image.pixels[x][y];
		const [r, g, b, a] = pixel;

		if (a === 1) {
			continue;
		}

		const constructedColor = Color3.fromRGB(r, g, b);
		const adjacentPart = x > 0 && partsRendered[x - 1][y];

		if (adjacentPart) {
			if (adjacentPart.Transparency === a && adjacentPart.Color === constructedColor) {
				adjacentPart.Size = adjacentPart.Size.add(x_increase);
				adjacentPart.Position = adjacentPart.Position.add(x_increase.div(2));

				partsRendered[x][y] = adjacentPart;
				continue;
			}
		}

		const pixelPart = part.Clone();
		pixelPart.Transparency = a;
		pixelPart.Color = constructedColor;
		pixelPart.Position = new Vector3(x, -y + image.dimensions[1], 0);
		pixelPart.Parent = Workspace;

		partsRendered[x][y] = pixelPart;
		amountRendered += 1;
	}

	columnCounter += 1;

	if (columnCounter > 9) {
		columnCounter = 0;
		RunService.Heartbeat.Wait();
	}
}

const timeTaken = os.clock() - start;

print("Amount normally needed:", image.dimensions[0] * image.dimensions[1]);
print("Amount rendered:", amountRendered);

print("Time taken:", timeTaken);
