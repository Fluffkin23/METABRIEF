import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: "http://localhost:9000",
  credentials: {
    accessKeyId:"minioadmin",
    secretAccessKey:"minioadmin"
  },
  forcePathStyle: true,
});

export async function uploadFile(file: File, setProgress?: (progress: number) => void) : PRomise<string> {
  try{
    const arrayBuffer = await file.arrayBuffer();
    const bucketName = 'meetings';
    const fileName = `${Date.now()}-${file.name}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type
    });

    await s3.send(command);
    return `http://localhost:9000/${bucketName}/${fileName}`;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}