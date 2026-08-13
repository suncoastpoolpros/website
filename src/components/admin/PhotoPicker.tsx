/**
 * Photo tray shared by both document builders. Photos live in component state
 * only (never the localStorage draft) — base64 images would quickly exceed the
 * storage quota — and are downscaled on pick before being baked into the PDF.
 */
import { ImagePlus, X } from 'lucide-react';
import { downscaleImage } from '@/lib/adminMedia';

export const MAX_PHOTOS = 8;

export const PhotoPicker = ({
  photos,
  setPhotos,
  hint,
}: {
  photos: string[];
  /** A useState setter — only the functional form is used. */
  setPhotos: (updater: (prev: string[]) => string[]) => void;
  hint: string;
}) => {
  const addPhotos = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return;
    const picked = Array.from(list).slice(0, room);
    const results = await Promise.all(picked.map((f) => downscaleImage(f).catch(() => null)));
    setPhotos((prev) =>
      [...prev, ...results.filter((r): r is string => r !== null)].slice(0, MAX_PHOTOS),
    );
  };

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  return (
    <>
      <p className="-mt-1 text-sm text-gray-400">{hint}</p>
      <div className="flex flex-wrap gap-3">
        {photos.map((src, i) => (
          <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-white/15">
            <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              aria-label="Remove photo"
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/25 text-gray-400 transition-colors hover:border-brand-blue-light hover:text-white">
            <ImagePlus className="h-5 w-5" />
            <span className="text-[11px]">Add</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addPhotos(e.target.files);
                e.currentTarget.value = '';
              }}
            />
          </label>
        )}
      </div>
      {photos.length > 0 && (
        <p className="text-xs text-gray-500">
          {photos.length} of {MAX_PHOTOS} added. Photos aren&apos;t saved in the draft — re-add them if
          you leave this page.
        </p>
      )}
    </>
  );
};
