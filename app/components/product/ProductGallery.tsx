import {useState} from 'react';

type GalleryImage = {url: string; alt: string};

export function ProductGallery({title, images}: {title: string; images: GalleryImage[]}) {
  const [selected, setSelected] = useState(0);
  const current = images[selected] ?? images[0];
  if (!current) return null;

  return (
    <div aria-label={`Images du produit ${title}`}>
      <div className="aspect-square overflow-hidden rounded-(--radius-control) border border-line bg-surface">
        <img
          key={current.url}
          src={current.url}
          alt={current.alt}
          loading={selected === 0 ? 'eager' : 'lazy'}
          className="size-full object-contain"
        />
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Choisir une image du produit">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              aria-label={`Afficher l’image ${index + 1} sur ${images.length} : ${image.alt}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={`aspect-square w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${selected === index ? 'border-ink' : 'border-line hover:border-ink/50'}`}
            >
              <img src={image.url} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
