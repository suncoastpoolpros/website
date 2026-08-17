/**
 * Photo tray shared by both document builders. Photos live in component state
 * only (never the localStorage draft) — base64 images would quickly exceed the
 * storage quota — and are downscaled on pick before being baked into the PDF.
 *
 * Accepts a click OR a drag-and-drop. On a laptop the photos are already in a
 * Finder window or a browser download, and dragging them in is the natural
 * move; the file picker is the slow path there.
 */
import { useRef, useState } from 'react';
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
  const [dragging, setDragging] = useState(false);
  // dragenter/dragleave also fire for every CHILD element, so a plain boolean
  // flickers off the moment the cursor crosses a thumbnail. Counting depth
  // means the highlight only clears when the pointer truly leaves the tray.
  const dragDepth = useRef(0);
  const full = photos.length >= MAX_PHOTOS;

  const addPhotos = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return;
    // A drop can contain anything — a PDF, a folder, a text clipping. Only
    // images are meaningful here.
    const picked = Array.from(list)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, room);
    if (picked.length === 0) return;
    const results = await Promise.all(picked.map((f) => downscaleImage(f).catch(() => null)));
    setPhotos((prev) =>
      [...prev, ...results.filter((r): r is string => r !== null)].slice(0, MAX_PHOTOS),
    );
  };

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const endDrag = () => {
    dragDepth.current = 0;
    setDragging(false);
  };

  return (
    <>
      <p className="-mt-1 text-sm text-gray-400">
        {hint} <span className="hidden sm:inline">Drag them in, or tap to browse.</span>
      </p>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (full) return;
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) endDrag();
        }}
        onDrop={(e) => {
          e.preventDefault();
          endDrag();
          if (!full) addPhotos(e.dataTransfer.files);
        }}
        className={`flex flex-wrap gap-3 rounded-xl border border-dashed p-3 transition-colors ${
          dragging ? 'border-brand-blue-light bg-brand-blue/10' : 'border-transparent'
        }`}
      >
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
        {!full && (
          <label
            className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed transition-colors ${
              dragging
                ? 'border-brand-blue-light text-white'
                : 'border-white/25 text-gray-400 hover:border-brand-blue-light hover:text-white'
            }`}
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[11px]">{dragging ? 'Drop' : 'Add'}</span>
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
