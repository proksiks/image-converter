import JSZip from "jszip"
import { defineEventHandler, readBody, createError } from "h3"

export default defineEventHandler(async (event) => {
  try {
    console.log("ZIP download API called")

    const body = await readBody(event)
    console.log("Request body received, images count:", body?.images?.length || 0)

    if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No images provided",
      })
    }

    const zip = new JSZip()

    body.images.forEach((image, index) => {
      console.log(`Adding image ${index + 1} to ZIP:`, image.filename)

      if (image.filename && image.data) {
        const buffer = Buffer.from(image.data, "base64")
        zip.file(image.filename, buffer)
      }
    })

    console.log("Generating ZIP file...")

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    })

    console.log("ZIP file generated successfully, size:", zipBuffer.length)

    const filename = `converted-images-${Date.now()}.zip`

    return {
      success: true,
      zipData: zipBuffer.toString("base64"),
      filename: filename,
    }
  } catch (error) {
    console.error("ZIP creation error:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Failed to create ZIP file",
    })
  }
})
