import { HttpService } from "@rbxts/services";
import { remotes } from "shared/remotes";
import { ImageResponse } from "types/ImageResponse";

const ENDPOINT = "http://127.0.0.1:8000/get-image";

remotes.Server.Create("GetImage").SetCallback(() => {
	const response = HttpService.GetAsync(ENDPOINT);
	const decoded = HttpService.JSONDecode(response);

	return decoded as ImageResponse;
});
