import { createContext, useState, ReactNode } from "react";

interface Doctor {
  id: string;
  name: string;
}

interface ContextProps {
  selectedDoctor: Doctor | null;
  setSelectedDoctor: (doctor: Doctor | null) => void;
  clearSelectedDoctor: () => void;
}

export const SelectedDoctorContext = createContext<ContextProps>({
  selectedDoctor: null,
  setSelectedDoctor: () => {},
  clearSelectedDoctor: () => {},
});

export const SelectedDoctorProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const clearSelectedDoctor = () => {
    setSelectedDoctor(null);
  };

  return (
    <SelectedDoctorContext.Provider
      value={{ selectedDoctor, setSelectedDoctor, clearSelectedDoctor }}
    >
      {children}
    </SelectedDoctorContext.Provider>
  );
};
