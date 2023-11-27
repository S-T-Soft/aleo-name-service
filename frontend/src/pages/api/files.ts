import {Formidable, errors as formidableErrors} from "formidable";
import fs from "fs";
import pinataSDK from "@pinata/sdk";
import * as process from "process";

const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

export const config = {
  api: {
    bodyParser: false,
  },
};

const saveFile = async (file) => {
  if (!file.filepath) {
    throw new Error('Invalid file path');
  }
  try {
    const stream = fs.createReadStream(file.filepath);
    const options = {
      pinataMetadata: {
        name: file.originalFilename,
      },
    };
    const response = await pinata.pinFileToIPFS(stream, options);
    fs.unlinkSync(file.filepath);

    return response;
  } catch (error) {
    throw error;
  }
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    let cancelUploads = false;// create variable at the same scope as form
    const options = {
      maxFiles: 1,
      maxFileSize: 1024 * 1024 * 5, // 5 MB
      filter: function ({name, originalFilename, mimetype}) {
        // keep only images
        const valid = mimetype && mimetype.includes("image");
        if (!valid) {
          form.emit('error', new formidableErrors.default('invalid type', 0, 400)); // optional make form.parse error
          cancelUploads = true; //variable to make filter return false after the first problem
        }
        return valid && !cancelUploads;
      }
    };

    const form = new Formidable(options);

    return form.parse(req)
      .then(([fields, files]) => {
        const f = files.file[0];
        const {address, message, signature} = fields;
        if (!address || address.length == 0 || !message || message.length == 0 || !signature || signature.length == 0) {
          throw new Error("Missing required fields");
        }
        // verify timestamp
        const time = new Date().getTime();
        const messageParts = message[0].split(" ");
        const timestamp = messageParts[messageParts.length - 1];
        if (Math.abs(+timestamp - time) > 300000) {
          throw new Error("Invalid message");
        }
        // verify signature
        // const account = Address.from_string(address[0]);
        // const encoder = new TextEncoder();
        // if (!account.verify(encoder.encode(message[0]), Signature.from_string(signature[0]))) {
        //   throw new Error("Invalid signature");
        // }
        return saveFile(f);
      }).then((response) => {
        const {IpfsHash} = response;
        res.status(200).send(IpfsHash)
      }).catch ((err) => {
        console.log({err});
        res.status(500).send(err.message || "Server Error");
      });
  } else if (req.method === "GET") {
    return pinata.pinList(
      {
        pageLimit: 1,
      }
    ).then(response => {
      res.json(response.rows[0]);
    }).catch(e => {
      console.log(e);
      res.status(500).send("Server Error");
    })
  } else {
    return res.status(405).send('Method Not Allowed');
  }
}
