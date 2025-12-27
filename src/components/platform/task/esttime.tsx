import React, { useEffect, useState } from 'react';

const EstTime = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const options = ['2', '4', '6', '8', '10', '12'];
  const [selected, setSelected] = useState(value || '4');

  useEffect(() => {
    onChange(selected);
  }, [selected, onChange]);

  const handleClick = (option: string) => {
    setSelected(option);
    onChange(option);
  };

  return (
    <div className="w-full p-2 border rounded-md">
      <div className="mb-2 text-sm text-muted-foreground">Estimated Time</div>
      <div className="flex flex-col items-center space-y-4">
        <div className="text-2xl font-medium">{selected.padStart(2, '0')} hr</div>
        <div className="w-full flex justify-between space-x-2">
          {options.map((option, i) => (
            <div 
              key={i} 
              className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition-all
                ${selected === option 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-black border-gray-300 hover:border-gray-500'}`} 
              onClick={() => handleClick(option)}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EstTime;