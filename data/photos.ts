// Site photos. Leave this array empty and no photo section appears anywhere on the site.
//
// To add photos: copy the image files into /public/photos/ and add one entry per photo:
//   { src: "/photos/site-clean.jpg", alt: "Two labourers loading a skip on a Sydney building site" }
// `alt` is required: describe what is in the photo for people using screen readers.
// Entries with an empty `alt` are skipped, so a photo can never go live without it.
// Use real photos only. Check that anyone clearly identifiable has agreed to appear.
// `caption` is optional.
export type SitePhoto = {
  src: string;
  alt: string;
  caption?: string;
};

export const photos: SitePhoto[] = [];
