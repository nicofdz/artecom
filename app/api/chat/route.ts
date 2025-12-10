import { NextResponse } from "next/server";

const apiKey = process.env.GROQ_API_KEY;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!apiKey) {
            return NextResponse.json({
                error: "Error de configuración: API Key no encontrada."
            }, { status: 500 });
        }

        // Construir el historial de mensajes en formato OpenAI
        const formattedMessages = [
            {
                role: "system",
                content: `Eres el asistente virtual de "ArteCom", un marketplace de artesanías chilenas.
Tu tono es amable, servicial y profesional.

Información clave:
- Vendemos productos únicos de artesanos locales (cerámica, textil, joyería, madera, etc.).
- Los envíos se realizan a todo Chile.
- Los precios y stock dependen de cada artesano.
- Fomentamos el comercio justo y el valor del trabajo hecho a mano.

Si te preguntan algo fuera de este contexto, responde amablemente que solo puedes ayudar con temas relacionados al marketplace.
No inventes precios ni stock específico, sugiere revisar el catálogo.

Responde de forma concisa (máximo 2-3 oraciones) y útil.`
            },
            ...messages.map((msg: any) => ({
                role: msg.role,
                content: msg.content
            }))
        ];

        // Llamar a Groq API (compatible con OpenAI)
        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: formattedMessages,
                    temperature: 0.7,
                    max_tokens: 200,
                    top_p: 0.9,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Groq API Error:", errorData);
            throw new Error("Error en la API de Groq");
        }

        const data = await response.json();
        const botMessage = data.choices[0]?.message?.content?.trim() || "Lo siento, no pude procesar tu mensaje.";

        return NextResponse.json({ message: botMessage });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json(
            { error: "Tuve un problema técnico. Por favor intenta de nuevo." },
            { status: 500 }
        );
    }
}
