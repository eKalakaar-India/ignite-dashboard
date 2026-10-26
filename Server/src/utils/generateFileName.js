import mime from "mime-types";

export const generateFileName = (
    originalName,
    mimetype,
    folder
) => {

    const extension = mime.extension(mimetype);
    const [date, time] = new Date().toISOString().split('T');
    return `${folder}/${date}-${time}.${extension}`;
};