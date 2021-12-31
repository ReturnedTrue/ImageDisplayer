/* eslint-disable @typescript-eslint/no-var-requires */

import express from "express";

const app = express();

app.get("/get-image", (req, res) => {
	res.json(require("../images/connor.json")).end();
});

app.listen(8000);
console.log("Listening on port 8000");
