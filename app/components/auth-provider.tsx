"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadComplete = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      initialLoadComplete.current = true;
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Solo mostrar loading en la carga inicial, no en cambios posteriores
      if (!initialLoadComplete.current) {
        setLoading(false);
        initialLoadComplete.current = true;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    try {
      // Limpiar el carrito del localStorage primero
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart');
      }

      // Cerrar sesión en Supabase
      await supabase.auth.signOut();

      // Limpiar el estado del usuario
      setUser(null);

      // Redirigir al inicio usando window.location para evitar interferencias
      if (typeof window !== 'undefined') {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Aún así redirigir al inicio
      if (typeof window !== 'undefined') {
        window.location.href = "/";
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


