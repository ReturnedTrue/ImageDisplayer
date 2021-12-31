import Net from "@rbxts/net";
import { ImageData } from "types/ImageData";

export const remotes = Net.Definitions.Create({
	GetImage: Net.Definitions.ServerFunction<() => ImageData>(),
});
