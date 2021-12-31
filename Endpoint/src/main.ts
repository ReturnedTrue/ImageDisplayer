/* eslint-disable @typescript-eslint/no-var-requires */

import express from "express";
import { FILE_NAME } from "./constants";

const app = express();
const data = require(`../images/${FILE_NAME}.json`);

app.get("/get-image", (req, res) => {
	res.json({
		name: FILE_NAME,
		data,
	});

	res.end();
});

app.listen(8000);
console.log("Listening on port 8000");
