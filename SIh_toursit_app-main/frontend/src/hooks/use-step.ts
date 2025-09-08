"use client";

import { useState, useCallback } from 'react';

export const useStep = (maxSteps: number) => {
    const [currentStep, setCurrentStep] = useState(1);

    const nextStep = useCallback(() => {
        setCurrentStep(prev => Math.min(prev + 1, maxSteps));
    }, [maxSteps]);

    const prevStep = useCallback(() => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    }, []);

    const goToStep = useCallback((step: number) => {
        if (step >= 1 && step <= maxSteps) {
            setCurrentStep(step);
        }
    }, [maxSteps]);

    return {
        currentStep,
        nextStep,
        prevStep,
        goToStep,
        isFirstStep: currentStep === 1,
        isLastStep: currentStep === maxSteps,
    };
};
