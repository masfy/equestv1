import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const TiltLogo = ({ logoUrl }) => {
    const cardRef = useRef(null);
    const [rotate, setRotate] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -25;
        const rotateY = ((x - centerX) / centerX) * 25;
        setRotate({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => setRotate({ x: 0, y: 0 });

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                perspective: 500,
                rotateX: rotate.x,
                rotateY: rotate.y,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-40 h-40 bg-white/20 backdrop-blur-sm p-6 rounded-3xl shadow-2xl mb-6 flex items-center justify-center cursor-pointer hover:shadow-blue-900/20 border border-white/30"
        >
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-lg" />
        </motion.div>
    );
};

export default TiltLogo;
