import Image from 'next/image'

interface RestaurantHeroProps {
  name: string
  description: string | null
  logoUrl: string | null
  coverUrl: string | null
  primaryColor: string
  city: string | null
  isOpen: boolean
}

export function RestaurantHero({
  name,
  description,
  logoUrl,
  coverUrl,
  primaryColor,
  city,
  isOpen,
}: RestaurantHeroProps) {
  return (
    <div className="relative">
      {/* Cover image */}
      <div
        className="h-44 w-full"
        style={{ backgroundColor: primaryColor + '30' }}
      >
        {coverUrl && (
          <Image
            src={coverUrl}
            alt={`${name} cover`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Restaurant info bar */}
      <div className="max-w-lg mx-auto px-4">
        <div className="relative -mt-8 flex items-end gap-3 pb-4">
          {/* Logo */}
          <div
            className="w-16 h-16 rounded-2xl border-4 border-white shrink-0 flex items-center justify-center overflow-hidden shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${name} logo`}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <span className="text-white text-xl font-bold">{name[0]}</span>
            )}
          </div>

          <div className="pb-1">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {city && <span className="text-xs text-gray-500">{city}</span>}
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  isOpen
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
        </div>

        {description && (
          <p className="text-sm text-gray-600 -mt-1 pb-4">{description}</p>
        )}
      </div>
    </div>
  )
}
