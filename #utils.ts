import { createError as h3CreateError, type H3Event } from "h3"
import formidable, { type File } from "formidable"

export async function readMultipartFormData(event: H3Event): Promise<formidable.Part[]> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true })

    form.parse(event.node.req, (err, fields, files) => {
      if (err) {
        reject(err)
        return
      }

      const formData: formidable.Part[] = []

      for (const key in fields) {
        if (Array.isArray(fields[key])) {
          ;(fields[key] as string[]).forEach((value) => {
            formData.push({
              name: key,
              data: Buffer.from(value, "utf-8"),
              filename: null,
              mimeType: null,
              transferEncoding: null,
              truncated: false,
            })
          })
        } else {
          formData.push({
            name: key,
            data: Buffer.from(fields[key] as string, "utf-8"),
            filename: null,
            mimeType: null,
            transferEncoding: null,
            truncated: false,
          })
        }
      }

      for (const key in files) {
        if (Array.isArray(files[key])) {
          ;(files[key] as File[]).forEach((file) => {
            formData.push({
              name: key,
              data: require("fs").readFileSync(file.filepath),
              filename: file.originalFilename,
              mimeType: file.mimetype,
              transferEncoding: null,
              truncated: false,
            })
          })
        } else {
          const file = files[key] as File
          formData.push({
            name: key,
            data: require("fs").readFileSync(file.filepath),
            filename: file.originalFilename,
            mimeType: file.mimetype,
            transferEncoding: null,
            truncated: false,
          })
        }
      }

      resolve(formData)
    })
  })
}

export function createError(options: { statusCode: number; statusMessage: string }) {
  return h3CreateError(options)
}
