import Net from "@rbxts/net";
import { ImageResponse } from "types/ImageResponse";

export const remotes = Net.Definitions.Create({
	GetImage: Net.Definitions.ServerFunction<() => ImageResponse>(),
});
