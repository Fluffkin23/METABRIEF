// Import necessary modules from the AWS SDK
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Create an S3 client instance
const s3 = new S3Client({
  region: 'us-east-1',
  endpoint: "http://localhost:9000",
  credentials: {
    accessKeyId:"minioadmin",
    secretAccessKey:"minioadmin123"
  },
  forcePathStyle: true,
});

// Function to upload a file to MinIO
export async function uploadFile(file: File, setProgress?: (progress: number) => void) : Promise<string> {
  try {
    // Convert the file to an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Define the bucket name and file name
    const bucketName = 'metabrief';
    const fileName = `${Date.now()}-${file.name}`;
    // Create a PutObjectCommand to upload the file
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type
    });

    // Send the command to MinIO
    await s3.send(command);
    const publicBaseUrl = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL || "http://localhost:9000";
    // Return the URL of the uploaded file
    return `${publicBaseUrl}/${bucketName}/${fileName}`;
  } catch (error) {
    // Log and throw any errors
    console.error("Error uploading file:", error);
    throw error;
  }
}