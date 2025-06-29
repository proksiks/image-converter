import { defineEventHandler } from "h3"
import sharp from "sharp"

export default defineEventHandler(async (event) => {
  try {
    console.log("Convert API called")

    const formData = await readMultipartFormData(event)
    console.log("Form data received:", formData?.length || 0, "items")

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No form data received",
      })
    }

    const formatItem = formData.find((item) => item.name === "format")
    const countItem = formData.find((item) => item.name === "count")

    const format = formatItem?.data?.toString()
    const count = Number.parseInt(countItem?.data?.toString() || "0")

    console.log("Format:", format, "Count:", count)

    if (!format || !["jpg", "png", "webp", "gif"].includes(format)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid format specified",
      })
    }

    const files = formData.filter((item) => item.name?.startsWith("file"))
    console.log("Files found:", files.length)

    if (files.length === 0 || files.length > 10) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid number of files (1-10 allowed)",
      })
    }

    const convertedImages = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`Processing file ${i + 1}:`, file.filename)

      if (!file.data || !file.filename) {
        console.log(`Skipping file ${i + 1}: missing data or filename`)
        continue
      }

      try {
        const originalName = file.filename.replace(/\.[^/.]+$/, "")
        const newFilename = `${originalName}.${format}`

        let convertedBuffer
        let mimeType

        const sharpInstance = sharp(file.data)

        switch (format) {
          case "jpg":
            convertedBuffer = await sharpInstance.jpeg({ quality: 90 }).toBuffer()
            mimeType = "image/jpeg"
            break
          case "png":
            convertedBuffer = await sharpInstance.png().toBuffer()
            mimeType = "image/png"
            break
          case "webp":
            convertedBuffer = await sharpInstance.webp({ quality: 90 }).toBuffer()
            mimeType = "image/webp"
            break
          case "gif":
            convertedBuffer = await sharpInstance.png().toBuffer()
            mimeType = "image/png"
            break
          default:
            throw new Error("Unsupported format")
        }

        console.log(`Converted ${file.filename} to ${newFilename}`)

        convertedImages.push({
          filename: newFilename,
          data: convertedBuffer.toString("base64"),
          mimeType: mimeType,
          size: convertedBuffer.length,
        })
      } catch (conversionError) {
        console.error(`Failed to convert ${file.filename}:`, conversionError)
      }
    }

    console.log("Conversion completed. Images converted:", convertedImages.length)

    if (convertedImages.length === 0) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to convert any images",
      })
    }

    return {
      success: true,
      images: convertedImages,
      count: convertedImages.length,
    }
  } catch (error) {
    console.error("Conversion error:", error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || "Internal server error during conversion",
    })
  }
})
