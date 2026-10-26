import sharp from "sharp";

export const optimizeImage = async (buffer) => {

    return sharp(buffer)

        .rotate()

        .resize({

            width: 1800,

            withoutEnlargement: true

        })

        .webp({

            quality: 80

        })

        .toBuffer();
};