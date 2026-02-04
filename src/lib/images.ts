import {
  UPLOAD_IMAGE_HOST,
  UPLOAD_IMAGE_PRIVATE_KEY,
  UPLOAD_IMAGE_PUBLIC_KEY,
} from "@/constants/env";
import ImageKit from "imagekit";

export const imageKit = new ImageKit({
  publicKey: UPLOAD_IMAGE_PUBLIC_KEY!,
  privateKey: UPLOAD_IMAGE_PRIVATE_KEY!,
  urlEndpoint: UPLOAD_IMAGE_HOST!,
});
