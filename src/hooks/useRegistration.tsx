import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { UPLOAD_URL, API_URL, CAMPAIGN_ID } from "../constants/RegistrationConstants";
import type { RouteParams } from "../constants/RegistrationConstants";

// Definición de la interfaz del hook para TypeScript
interface RegistrationHook {
    loading: boolean;
    compressing: boolean;
    preview: string | null;
    compressedFile: File | null;
    message: string;
    name: string;
    dni: string;
    phoneNumber: string;
    storeId: string | undefined;
    setName: (value: string) => void;
    setDni: (value: string) => void;
    setPhoneNumber: (value: string) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}
interface ClaimResponse {
    prize?: string;
    photoUrl?: string;
    message?: string;
    error?: string;
}

export const useRegistration = (): RegistrationHook => {
    // === ESTADOS ===
    const [loading, setLoading] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [compressedFile, setCompressedFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");

    // Estados para los inputs
    const [name, setName] = useState('');
    const [dni, setDni] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // === HOOKS DE ROUTER ===
    const { storeId } = useParams<RouteParams>();
    const navigate = useNavigate();

    // === MEJORA: Validaciones de Archivo ===
    const validateFile = (file: File): string | null => {
        // 1. Validar tipo de archivo (Evitar GIFs y Videos)
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            return "❌ Formato no soportado. Solo se aceptan fotos (JPG, PNG, HEIC). No GIFs ni videos.";
        }

        // 2. Validar tamaño inicial extremo (ej: mayor a 15MB ni intentar comprimir)
        const maxSizeOriginal = 15 * 1024 * 1024; // 15MB
        if (file.size > maxSizeOriginal) {
            return "❌ La imagen es demasiado pesada (Máx 15MB). Intenta tomar una foto nueva.";
        }

        return null;
    };
    // === MANEJADORES DE ARCHIVOS (Compresión) ===
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setMessage(""); // Limpiar errores previos

        if (!file) {
            setCompressedFile(null);
            setPreview(null);
            return;
        }

        // A. Validaciones Iniciales
        const errorMsg = validateFile(file);
        if (errorMsg) {
            setMessage(errorMsg);
            setCompressedFile(null);
            setPreview(null);
            e.target.value = ""; // Limpiar el input para permitir re-selección
            return;
        }

        // B. Generar Preview
        try {
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
        } catch (error) {
            setMessage("❌ No se pudo previsualizar la imagen.");
            return;
        }

        // C. Compresión
        setCompressing(true);
        try {
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1280, // 1280px es ideal para lectura de textos
                useWebWorker: false,    // Mantenemos false por estabilidad
                fileType: file.type     // Mantiene el tipo original (jpg/png)
            };

            const compressed = await imageCompression(file, options);
            setCompressedFile(compressed);
            
        } catch (err) {
            console.error("Fallo compresión:", err);
            // Si falla la compresión, pero el archivo ya pasó la validación de tamaño (<15MB),
            // lo dejamos pasar original, pero avisamos en consola.
            console.warn("Usando imagen original como fallback.");
            setCompressedFile(file);
        } finally {
            setCompressing(false);
        }
    };

    // === ENVÍO DE FORMULARIO (Validación y Subida) ===
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage("");

        // ** VALIDACIONES DE LONGITUD Y OBLIGATORIEDAD **
        const trimmedName = name.trim();
        const trimmedPhone = phoneNumber.trim();
        const trimmedDni = dni.trim();

        let validationError = '';

        if (!trimmedName || !trimmedPhone || !compressedFile) {
            validationError = "❌ Nombre, Teléfono y Foto son campos obligatorios.";
        } else if (trimmedName.length > 45) {
            validationError = "❌ Nombre no debe exceder los 45 caracteres.";
        } else if (trimmedPhone.length !== 9 || !/^\d+$/.test(trimmedPhone)) {
            validationError = "❌ Teléfono debe tener exactamente 9 dígitos.";
        } else if (trimmedDni && (trimmedDni.length > 9 || !/^\d+$/.test(trimmedDni))) {
            validationError = "❌ Formato de DNI invalido";
        }

        if (validationError) {
            setMessage(validationError);
            return;
        }

        if (!storeId) {
             setMessage("❌ Error crítico: ID de tienda no definido.");
             return;
        }
        
        setLoading(true);

        let photoUrl = "";

        // 1. SUBIR LA FOTO COMPRIMIDA (Servicio PHP)
        try {
            const uploadData = new FormData();
            uploadData.append("photo", compressedFile as File);

            const uploadRes = await fetch(UPLOAD_URL, {
                method: "POST",
                body: uploadData,
            });

            if (!uploadRes.ok) {
                const errorText = await uploadRes.text();
                throw new Error(`Error en la subida : ${uploadRes.status} - ${errorText}`);
            }

            const uploadJson = await uploadRes.json();
            photoUrl = uploadJson.url;
        } catch (err) {
            console.error("Error al subir la foto:", err);
            setMessage(`❌ Fallo crítico al subir la foto. ${err instanceof Error ? err.message : 'Error desconocido.'}`);
            setLoading(false);
            return;
        }

        // 2. ENVIAR PAYLOAD FINAL AL BACKEND (Render)
        const payload = {
            name: trimmedName,
            phoneNumber: trimmedPhone,
            dni: trimmedDni || undefined,
            storeId,
            campaign: CAMPAIGN_ID,
            photoUrl,
        };

        try {
    // MEJORA 1: Timeout de seguridad (10 segundos)
    // Si el internet es muy lento, no dejamos al usuario esperando para siempre
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${API_URL}/api/v1/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal, // Vinculamos el timeout
    });
    
    clearTimeout(timeoutId); // Limpiamos el timer si respondió a tiempo

    // MEJORA 2: Lectura segura de la respuesta
    // Primero obtenemos el texto, luego intentamos parsearlo. 
    // Esto evita que la app explote si el servidor devuelve HTML (Error 500/502)
    const textResponse = await res.text(); 
    let resJson: ClaimResponse = {};

    try {
        resJson = JSON.parse(textResponse);
    } catch (e) {
        // Si no es JSON, probablemente sea un error fatal del servidor (HTML)
        console.error("Respuesta no-JSON recibida:", textResponse);
        throw new Error(`Error del servidor (${res.status}). Intente más tarde.`);
    }

    // MEJORA 3: Manejo de errores HTTP específicos
    if (!res.ok) {
        // Buscamos el mensaje de error en varios lugares posibles
        const errorMsg = resJson.message || resJson.error || "No se pudo registrar el premio.";
        
        // Si es error 400-499 (Error de usuario/validación) vs 500 (Error servidor)
        if (res.status >= 500) {
            throw new Error("Problemas técnicos en el servidor o tienda sin premios. Intente en unos minutos.");
        }
        
        // Si es error de lógica (ej: "Ya participaste"), lo mostramos directo
        setMessage(`❌ ${errorMsg}`);
        return; // Detenemos la ejecución aquí
    }

    // ÉXITO
    const prizeName = resJson.prize || "¡Premio sorpresa!";
    // Usamos la foto que nos devuelve el back (por si la renombró) o la que subimos
    const finalPhotoUrl = resJson.photoUrl || photoUrl; 

    navigate("/exit", {
        state: {
            prizeName,
            photoUrl: finalPhotoUrl,
        },
    });

} catch (err: any) {
    console.error("Error en claim:", err);

    // MEJORA 4: Mensajes de error diferenciados
    if (err.name === 'AbortError') {
        setMessage("⚠️ La conexión está muy lenta. Revisa tu internet.");
    } else if (err.message.includes("Failed to fetch")) {
        setMessage("❌ Sin conexión a internet. Verifica tus datos.");
    } else {
        // Mostramos el error que lanzamos manualmente arriba o el genérico
        setMessage(err.message || "❌ Error inesperado. Intente nuevamente.");
    }
} finally {
    setLoading(false);
}
    };

    return {
        loading,
        compressing,
        preview,
        compressedFile,
        message,
        name,
        dni,
        phoneNumber,
        storeId,
        setName,
        setDni,
        setPhoneNumber,
        handleFileChange,
        handleSubmit,
    };
};