"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

type Product = {
    id: string;
    name: string;
    category: string;
    price: number;
    images: string[];
    stock: number;
    artisan_id: string;
};

type RecommendationsProps = {
    productId: string;
};

export default function Recommendations({ productId }: RecommendationsProps) {
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRecommendations() {
            try {
                setLoading(true);
                const response = await fetch(`/api/products?recommend_for=${productId}`);
                if (response.ok) {
                    const data = await response.json();
                    setRecommendations(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Error loading recommendations:", error);
            } finally {
                setLoading(false);
            }
        }

        if (productId) {
            fetchRecommendations();
        }
    }, [productId]);

    if (loading) {
        return (
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">También te puede interesar</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-square bg-slate-200 rounded-xl mb-3" />
                            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                            <div className="h-4 bg-slate-200 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return null;
    }

    return (
        <div className="mt-12 border-t border-slate-200 pt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">También te puede interesar</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {recommendations.map((product) => (
                    <Link
                        key={product.id}
                        href={`/catalogo/${product.id}`}
                        className="group block rounded-xl border border-slate-200 bg-white p-3 transition-all hover:shadow-lg hover:border-emerald-500"
                    >
                        <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100 mb-3">
                            {product.images && product.images.length > 0 ? (
                                <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <span className="text-4xl">📦</span>
                                </div>
                            )}
                        </div>
                        <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                            {product.name}
                        </h3>
                        <p className="text-xs text-slate-500 mb-2">{product.category}</p>
                        <p className="text-lg font-bold text-emerald-600">
                            ${product.price.toLocaleString('es-CL')}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
