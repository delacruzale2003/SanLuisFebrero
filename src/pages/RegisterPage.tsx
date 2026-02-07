import React, { useState } from "react";
import { useRegistration } from "../hooks/useRegistration";
import { Loader2, X } from 'lucide-react';
import BackgroundCC from "../components/BackgroundCC";

const RegisterPage: React.FC = () => {
    const [showTermsModal, setShowTermsModal] = useState(true);

    const {
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
    } = useRegistration();

    const handleCloseModal = () => {
        setShowTermsModal(false);
    };

    if (!storeId) {
        return (
            <div className="p-8 text-center text-red-700 bg-red-100 min-h-screen flex items-center justify-center font-mont-bold border-none">
                Error: ID de tienda no encontrado en la URL. Asegúrate de escanear el QR correctamente.
            </div>
        );
    }

    const isFormValid = name.trim() !== '' && phoneNumber.trim() !== '' && dni.trim() !== '' && compressedFile;
    const isDisabled = loading || compressing || !isFormValid || showTermsModal;

    return (
        // CONTENEDOR PRINCIPAL
        // min-h-[100dvh] asegura que cubra toda la altura visible en móviles
        <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-start overflow-x-hidden border-none outline-none bg-transparent font-mont-regular">

            {/* 1. Fondo (Z-0) */}
            <BackgroundCC />

            {/* 2. Capa de Contenido */}
            {/* pb-28 para dejar espacio al botón flotante inferior */}
            <div className={`relative z-10 w-full flex flex-col items-center px-4 pt-4 pb-28 transition-all duration-500 border-none ${loading ? 'blur-md pointer-events-none' : 'blur-0'}`}>

                {/* Logo */}
                <img
                    src="/pws_sanluis.png"
                    alt="Logo CC"
                    className="w-72 xs:w-40 sm:w-48 h-auto mb-18 sm:mb-10 object-contain mt-5"
                />

                {/* Contenedor del Formulario */}
               <form
    id="registrationForm"
    onSubmit={handleSubmit}
    // W-[90%] para móviles, max-w-sm para que no se estire en tablets
    className="relative bg-transparent border-2 border-black rounded-3xl p-4 pt-10 w-[90%] max-w-sm space-y-3 sm:space-y-4 mb-2 shadow-sm"
>
    {/* --- IMAGEN TÍTULO EN EL BORDE SUPERIOR --- */}
    <img
        src="/registrate.png"
        alt="Regístrate"
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-10 xs:h-12 sm:h-14 object-contain w-62"
    />

    {message && (
        <p className="text-center text-xs font-medium p-2 bg-red-100 text-red-700 rounded-lg mt-2 leading-tight">
            {message}
        </p>
    )}

    {/* --- INPUTS --- */}
    <div className="mt-2 space-y-3 sm:space-y-4">

        {/* INPUT: NOMBRES */}
        <div>
            <h2 className="text-lg text-[#afafaf] xs:text-base font-mont-bold mb-2 leading-4 mt-4">
                Llena tus datos y participa <br />por fabulosos premios
            </h2>
            <label className="block text-[#afafaf] text-md xs:text-base font-mont-bold">
                Nombres y apellidos
            </label>
            <input
                type="text"
                name="name"
                required
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={45}
                className="bg-transparent border-2 border-black py-2 xs:py-2.5 px-4 w-full rounded-full text-black text-sm xs:text-base placeholder-black/70 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors shadow-inner disabled:opacity-50"
            />
        </div>

        {/* INPUT: DNI (MEJORADO) */}
        <div>
            <label className="block text-[#afafaf] text-md xs:text-base font-mont-bold">
                Número de DNI
            </label>
            <input
                type="tel" // CAMBIO: "tel" para mejor teclado en Android/iOS
                inputMode="numeric" // CAMBIO: Fuerza teclado numérico
                name="dni"
                value={dni}
                disabled={loading}
                onChange={(e) => {
                    // CAMBIO: Filtra letras automáticamente
                    const val = e.target.value.replace(/\D/g, '');
                    setDni(val);
                }}
                maxLength={11}
                required
                className="bg-transparent border-2 border-black py-2 xs:py-2.5 px-4 w-full rounded-full text-black text-sm xs:text-base placeholder-black/70 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors shadow-inner disabled:opacity-50"
            />
        </div>

        {/* INPUT: TELEFONO (MEJORADO) */}
        <div>
            <label className="block text-[#afafaf] text-md xs:text-base font-mont-bold">
                Teléfono
            </label>
            <input
                type="tel"
                inputMode="numeric" // CAMBIO: Fuerza teclado numérico
                name="phone_number"
                required
                disabled={loading}
                value={phoneNumber}
                onChange={(e) => {
                    // CAMBIO: Filtra letras automáticamente
                    const val = e.target.value.replace(/\D/g, '');
                    setPhoneNumber(val);
                }}
                maxLength={9}
                className="bg-transparent border-2 border-black py-2 xs:py-2.5 px-4 w-full rounded-full text-black text-sm xs:text-base placeholder-black/70 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors shadow-inner disabled:opacity-50"
            />
        </div>

        {/* INPUT: ARCHIVO (MEJORADO CON TEXTO DE AYUDA) */}
        <div>
            <label className="block text-[#afafaf] text-md xs:text-base font-mont-bold">
                Foto de Voucher
            </label>

            <div className={`mt-1 ${preview ? 'flex flex-row items-center gap-2' : ''}`}>
                <input
                    type="file"
                    id="photo-upload"
                    name="photo_url"
                    // CAMBIO: Lista explícita para bloquear videos y GIFs en el sistema
                    accept=".jpg, .jpeg, .png, .webp, .heic, .heif"
                    required
                    disabled={loading}
                    onChange={handleFileChange}
                    className="hidden"
                />

                <label
                    htmlFor="photo-upload"
                    // Agregué 'flex-col' para apilar el texto nuevo debajo del botón
                    className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-black text-black font-mont-extrabold leading-none tracking-tight uppercase transition-colors 
                        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black hover:text-white'}
                        ${preview
                            ? 'flex-1 h-20 text-xs px-1 text-center' // Si hay preview
                            : 'w-full py-2 xs:py-3 px-4 text-sm xs:text-base sm:text-lg' // Si no hay preview
                        }`}
                >
                    <span>SELECCIONAR ARCHIVO</span>
                    
                    {/* CAMBIO: Texto de ayuda visual */}
                    <span className={`font-mont-regular mt-1 opacity-60 normal-case ${preview ? 'text-[9px] leading-tight' : 'text-[10px] xs:text-xs'}`}>
                        (Solo fotos - Máx 15MB)
                    </span>
                </label>

                {preview && (
                    <div className="relative flex-1 h-20 border-2 border-gray-300 rounded-xl overflow-hidden shadow-md bg-white">
                        <img src={preview} alt="preview" className="object-cover w-full h-full" />
                        {compressing && (
                            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                                <Loader2 className="animate-spin w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
</form>

                {/* BARRA FIJA INFERIOR */}
                <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 z-20 flex justify-center pointer-events-none bg-gradient-to-t from-white/10 to-transparent">
                    <button
                        type="submit"
                        form="registrationForm"
                        disabled={isDisabled}
                        className="pointer-events-auto bg-black font-mont-bold rounded-full text-xl sm:text-2xl text-white py-3 w-full max-w-[220px] shadow-2xl flex items-center justify-center disabled:bg-gray-400 hover:scale-105 transition-transform"
                    >
                        JUGAR
                    </button>
                </div>
            </div>

            {/* 3. Overlay de Carga */}
            {loading && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-black/90 p-6 rounded-3xl flex flex-col items-center shadow-2xl">
                        <Loader2 className="animate-spin w-10 h-10 sm:w-16 sm:h-16 text-white mb-3" />
                        <p className="font-mont-bold text-base sm:text-xl tracking-widest text-white animate-pulse">PROCESANDO...</p>
                    </div>
                </div>
            )}

            {/* 2. MODAL DE TÉRMINOS Y CONDICIONES */}
           {showTermsModal && (
                <div className="fixed inset-0 backdrop-blur-xl flex items-center justify-center z-50 p-4">
                    {/* CAMBIO DE ANCHO: max-w-[80%] y sm:max-w-xs */}
                    <div className="bg-transparent text-black rounded-3xl p-5 pt-10 w-full max-w-[70%] sm:max-w-xs max-h-[85vh] flex flex-col relative shadow-xl border-[3px] border-black bg-white/20">
                        
                        {/* Botón de Cerrar (X) */}
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-3 right-3 hover:text-gray-800 transition-colors border-2 border-black text-black rounded-full p-1 bg-white"
                            aria-label="Cerrar términos y condiciones"
                        >
                            <X size={20} />
                        </button>

                        {/* Contenido Desplazable */}
                        <div className="flex-grow overflow-y-auto text-black text-xs sm:text-sm space-y-3 pr-2 leading-relaxed custom-scrollbar">
                            <p className="font-markpro">
                                <strong className="font-markpro">Promoción válida del 07 de febrero del 2026 al 07 de marzo del 2026. Participan personas naturales mayores de 18 años, con residencia legal y domicilio en el Perú. <br /></strong>
                                <br />
                                <strong>Mecánica: AASS: </strong>Por la compra mínima de S/ 20.00 en bebidas San Luis (SL) o Powerade, C&C (Vega y Makro): Por la compra mínima de S/ 80.00 en bebidas San Luis (SL) o Powerade, participa y llévate grandes premios. Para participar, el consumidor deberá escanear el código QR, completar sus datos en el landing page y subir la foto del voucher de compra válido.
                                <br /><br />
                                Horario de participación:
                                Sábados de 4:00 p.m. a 8:00 p.m. y Domingos de 11:00 a.m. a 3:00 p.m. Premios: Viseras , Bola de playa , Vasos y Neceseres , sujetos a stock y disponibilidad.
                                Entrega de premios: Los premios se entregarán en el área de activación de la marca, previa validación del voucher de compra y la pantalla de confirmación del premio, por el personal autorizado.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterPage;