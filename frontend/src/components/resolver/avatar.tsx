import {Record} from "@/types";
import {useClient} from "@/lib/hooks/use-client";
import {useANS} from "@/lib/hooks/use-ans";
import {useEffect, useRef, useState} from "react";
import toast from "@/components/ui/toast";
import Button from "@/components/ui/button";
import {useBoolean} from "react-use";
import * as process from "process";
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import {RefreshIcon} from "@/components/icons/refresh";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL
  ? process.env.NEXT_PUBLIC_GATEWAY_URL
  : "https://gateway.pinata.cloud/ipfs/";

export default function Avatar({record, onlyView = false, ...props}: { record: Record, onlyView: boolean }) {
  const {getResolver} = useClient();
  const {setResolverRecord} = useANS();
  const {publicKey, signMessage} = useWallet();
  const [loading, setLoading] = useBoolean(true);
  const [avatar, setAvatar] = useState("");
  const [uploading, setUploading] = useState(false);
  const [setting, setSetting] = useState(false);
  const [status, setStatus] = useState("");


  const inputFile = useRef(null);


  const handleAvatarChange = async (e) => {
    const fileToUpload = e.target.files[0];
    try {
      setUploading(true);
      const formData = new FormData();
      // message equals to f.originalFilename + time
      const message = `Upload file ${fileToUpload.name} at ${new Date().getTime()}`;
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      // ensure fileToUpload is an image and size max 5MB
      if (!fileToUpload.type.startsWith("image")) {
        throw new Error("File is not an image");
      }
      if (fileToUpload.size > 5 * 1024 * 1024) {
        throw new Error("Max file size is 5MB");
      }

      signMessage(encoder.encode(message)).then((signature) => {
        formData.append("file", fileToUpload, fileToUpload.name);
        formData.append("address", publicKey || "");
        formData.append("message", message);
        formData.append("signature", decoder.decode(signature));
        return fetch("/api/files", {
          method: "POST",
          body: formData,
        })
      }).then(res => {
        if (res.status != 200) {
          throw new Error("Trouble uploading avatar file");
        }
        return res.text();
      }).then(ipfsHash => {
        inputFile.current.value = "";
        return setResolverRecord(record.name, "avatar", `ipfs://${ipfsHash}`, (running: boolean, status: any) => {
          setSetting(running);
          setStatus(status.message);
          if (status.message === 'Finalized') {
            setAvatar(`${GATEWAY_URL}${ipfsHash}`);
            toast(
              {
                type: "success",
                message: "Avatar updated"
              }
            );
          }
        });
      }).catch((err) => {
        toast(
          {
            type: "error",
            message: err.message || "Trouble uploading avatar file"
          }
        );
      }).finally(() => {
        inputFile.current.value = "";
        setUploading(false);
      });
    } catch (e: any) {
      setUploading(false);
      toast(
        {
          type: "error",
          message: e.message || "Trouble uploading avatar file"
        }
      );
    }
  };

  useEffect(() => {
    if (record) {
      setLoading(true);
      getResolver(record.name, "avatar").then((resolver) => {
        if (resolver != null) {
          setAvatar(resolver.value.replace("ipfs://", GATEWAY_URL));
        }
      }).finally(() => {
        setLoading(false);
      })
    }
  }, [record]);

  return <>
    <div className="mr-4">
      {avatar !== "" && (
        <img
          src={avatar}
          alt="Avatar"
          className="rounded-full w-24 h-24"
        />
      )}
    </div>
    <input
      type="file"
      id="file"
      ref={inputFile}
      onChange={handleAvatarChange}
      style={{display: "none"}}
    />
    {!setting && <Button
        disabled={uploading || loading}
        className="bg-sky-500"
        size="mini"
        onClick={() => inputFile.current.click()}
    >
      {loading ? "Loading" : uploading ? "Uploading..." : avatar === "" ? "Set" : "Change"}
    </Button>}
    {setting && <Button className="bg-sky-500" size="mini" disabled={true}><RefreshIcon
        className="inline motion-safe:animate-spin"/> {status}</Button>}
  </>
}