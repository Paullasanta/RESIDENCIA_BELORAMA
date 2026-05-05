'use client'

import { useState } from 'react'

interface RoomGalleryProps {
    photos: string[]
    title: string
}

export function RoomGallery({ photos, title }: RoomGalleryProps) {
    const count = photos.length

    return (
        <div className="relative group">
            {/* Desktop Dynamic Grid */}
            <div className={`hidden sm:grid gap-3 h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-gray-200/50 ${
                count === 1 ? 'grid-cols-1' : 
                count === 2 ? 'grid-cols-2' : 
                'grid-cols-4 grid-rows-2'
            }`}>
                
                {/* Lógica de Renderizado Dinámico */}
                {count === 1 && (
                    <div className="col-span-4 row-span-2 relative overflow-hidden flex justify-center bg-gray-50/50">
                        <div className="max-w-4xl w-full h-full">
                            <img src={photos[0]} alt={title} className="w-full h-full object-contain hover:scale-105 transition-transform duration-700 cursor-pointer" />
                        </div>
                    </div>
                )}

                {count === 2 && (
                    <>
                        <div className="relative overflow-hidden"><img src={photos[0]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                        <div className="relative overflow-hidden"><img src={photos[1]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                    </>
                )}

                {count === 3 && (
                    <>
                        <div className="col-span-2 row-span-2 relative overflow-hidden"><img src={photos[0]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                        <div className="col-span-2 row-span-1 relative overflow-hidden"><img src={photos[1]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                        <div className="col-span-2 row-span-1 relative overflow-hidden"><img src={photos[2]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                    </>
                )}

                {count === 4 && (
                    <>
                        <div className="col-span-2 row-span-2 relative overflow-hidden"><img src={photos[0]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                        <div className="col-span-2 row-span-1 relative overflow-hidden"><img src={photos[1]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                        <div className="col-span-1 row-span-1 relative overflow-hidden"><img src={photos[2]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                        <div className="col-span-1 row-span-1 relative overflow-hidden"><img src={photos[3]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                    </>
                )}

                {count >= 5 && (
                    <>
                        <div className="col-span-2 row-span-2 relative overflow-hidden"><img src={photos[0]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                        <div className="col-span-1 row-span-1 relative overflow-hidden"><img src={photos[1]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                        <div className="col-span-1 row-span-1 relative overflow-hidden"><img src={photos[2]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                        <div className="col-span-1 row-span-1 relative overflow-hidden"><img src={photos[3]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" /></div>
                        <div className="col-span-1 row-span-1 relative overflow-hidden">
                            <img src={photos[4]} alt={title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer" />
                            {count > 5 && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                    <span className="bg-white/90 backdrop-blur-md text-[#072E1F] text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest">
                                        + {count - 5} Fotos
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Mobile Carousel (Simple) */}
            <div className="sm:hidden aspect-[4/3] rounded-[2rem] overflow-hidden relative">
                <img src={photos[0]} className="w-full h-full object-cover" alt={title} />
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-[10px] px-3 py-1 rounded-full">
                    1 / {photos.length}
                </div>
            </div>
        </div>
    )
}
