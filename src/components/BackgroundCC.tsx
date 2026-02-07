import React from 'react';

const BackgroundCC: React.FC = () => {
  return (
    <>
      {/* -------------------------------------------------------------
        BLOQUE DE IMAGEN ANTERIOR (COMENTADO)
        -------------------------------------------------------------
        Si necesitas restaurar la imagen 'bgccmundial.png', 
        descomenta el siguiente bloque <div>.
      */}

      {/* <div 
        className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
        style={{
          // 1. Referencia a tu imagen
          backgroundImage: "url('/bgccmundial.png')",
          
          // 2. LA CLAVE PARA TU REQUERIMIENTO:
          // 'center center' asegura que al recortarse en móviles,
          // se mantenga el foco en el medio de la imagen.
          backgroundPosition: 'center center', 
          
          // 3. COMPORTAMIENTO RESPONSIVO:
          // 'cover' escala la imagen para llenar todo el contenedor.
          backgroundSize: 'cover', 
          
          backgroundRepeat: 'no-repeat',
          
          // Filtro opcional
          filter: 'brightness(1.0)' 
        }}
      />
      */}
      
      {/* <div className="fixed inset-0 w-full h-full -z-0 bg-black/20" /> */}


      {/* -------------------------------------------------------------
        NUEVO FONDO: BLANCO PLANO 
        -------------------------------------------------------------
      */}
      <div className="fixed inset-0 w-full h-full -z-10 bg-white pointer-events-none" />

    </>
  );
}

export default BackgroundCC;