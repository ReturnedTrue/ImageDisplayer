import { HttpService } from "@rbxts/services";
import { remotes } from "shared/remotes";
import { ImageData } from "types/ImageData";

remotes.Server.Create("GetImage").SetCallback(() => {
	const response = HttpService.GetAsync("http://127.0.0.1:8000/get-image");
	const decoded = HttpService.JSONDecode(response);

	return decoded as ImageData;
});
