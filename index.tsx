import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONSTANTS ---
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:\'",.<>/?~';
const AMBIGUOUS = 'O0lI|';

// Basic word list for passphrase generation
const WORD_LIST = [
  'apple', 'banana', 'orange', 'grape', 'lemon', 'lime', 'melon', 'peach',
  'pear', 'plum', 'berry', 'cherry', 'kiwi', 'mango', 'papaya', 'cloud',
  'forest', 'flower', 'mountain', 'river', 'ocean', 'stream', 'meadow',
  'valley', 'canyon', 'desert', 'island', 'jungle', 'aurora', 'breeze',
  'cascade', 'comet', 'cosmos', 'crystal', 'delta', 'dune', 'echo', 'ember',
  'galaxy', 'glacier', 'haven', 'horizon', 'lagoon', 'lumen', 'mirage',
  'nebula', 'nova', 'oasis', 'orbit', 'origin', 'pulse', 'quasar', 'quest',
  'radiant', 'ripple', 'serene', 'shadow', 'solar', 'spirit', 'summit',
  'synergy', 'tempest', 'tidal', 'tundra', 'umbra', 'union', 'unity',
  'valor', 'vector', 'vertex', 'vibrant', 'vista', 'vortex', 'wave', 'willow',
  'winter', 'wonder', 'yellow', 'zodiac', 'zone', 'zephyr', 'zenith',
  'azure', 'blue', 'green', 'indigo', 'ivory', 'jade', 'khaki', 'lilac'
];

// --- UTILITY FUNCTIONS ---

// Cryptographically secure random number generation
const secureRandom = (count) => {
  const values = new Uint32Array(count);
  crypto.getRandomValues(values);
  return Array.from(values);
};

const secureRandomNumber = (max) => {
  const randomValues = secureRandom(1);
  return randomValues[0] % max;
};

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = secureRandomNumber(i + 1);
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const timeAgo = (date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  if (seconds < 10) return "just now";
  return Math.floor(seconds) + " seconds ago";
};


// --- UI COMPONENTS ---

const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d={path} />
  </svg>
);

const CopyIcon = () => <Icon path="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />;
const CheckIcon = () => <Icon path="M9,16.17L4.83,12l-1.42,1.41L9,19,21,7l-1.41-1.41z" />;
const RefreshIcon = () => <Icon path="M17.65,6.35C16.2,4.9,14.21,4,12,4c-4.42,0-7.99,3.58-7.99,8s3.57,8,7.99,8c3.73,0,6.84-2.55,7.73-6h-2.08c-.82,2.33-3.04,4-5.65,4-3.31,0-6-2.69-6-6s2.69-6,6-6c1.66,0,3.14,.69,4.22,1.78L13,11h7V4l-2.35,2.35z" />;
const TrashIcon = () => <Icon path="M6,19c0,1.1,.9,2,2,2h8c1.1,0,2-.9,2-2V7H6v12zM19,4h-3.5l-1-1h-5l-1,1H5v2h14V4z" />;
const EyeOpenIcon = () => <Icon path="M12,4.5C7,4.5,2.73,7.61,1,12c1.73,4.39,6,7.5,11,7.5s9.27-3.11,11-7.5C21.27,7.61,17,4.5,12,4.5zM12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5,5,2.24,5,5-2.24,5-5,5zm0-8c-1.66,0-3,1.34-3,3s1.34,3,3,3,3-1.34,3-3-1.34-3-3-3z" />;
const EyeClosedIcon = () => <Icon path="M12,7c2.76,0,5,2.24,5,5,0,.65-.13,1.26-.36,1.83l2.92,2.92c1.51-1.26,2.7-2.89,3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4,0-2.74,.25-3.98,.7l2.16,2.16C10.74,7.13,11.35,7,12,7zM2,4.27l2.28,2.28,4.52,4.52L2,4.27zM2,4.27l2.28,2.28.46.46A11.804,11.804,0,0,0,1,12c1.73,4.39,6,7.5,11,7.5,1.55,0,3.03-.3,4.38-.84l.42,.42L19.73,22,21,20.73,3.27,3,2,4.27zM7.53,9.8l1.55,1.55c-.05,.21-.08,.43-.08,.65,0,1.66,1.34,3,3,3,.22,0,.44-.03,.65-.08l1.55,1.55c-.67,.33-1.41,.53-2.2,.53-2.76,0-5-2.24-5-5,0-.79,.2-1.53,.53-2.2z" />;

const Tooltip = ({ text, children }) => (
  <div className="relative flex items-center group">
    {children}
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
      {text}
    </div>
  </div>
);

const Slider = ({ label, value, min, max, onChange, unit = "" }) => (
  <div className="space-y-2">
    <label className="flex justify-between text-sm font-medium text-gray-300">
      <span>{label}</span>
      <span className="text-indigo-400 font-semibold">{value} {unit}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={onChange}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-indigo-500"
    />
  </div>
);

const Checkbox = ({ label, checked, onChange, tooltipText }) => (
  <label className="flex items-center space-x-3 cursor-pointer select-none">
    <div className="relative">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <div className={`box block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-gray-600'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`}></div>
    </div>
    <Tooltip text={tooltipText}>
      <span className="text-sm font-medium text-gray-300">{label}</span>
    </Tooltip>
  </label>
);

const Button = ({ onClick, children, className = '', variant = 'primary' }) => {
  const baseClasses = "px-4 py-2 rounded-lg font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center justify-center space-x-2";
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500',
    secondary: 'bg-gray-600 text-gray-200 hover:bg-gray-500 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-300 hover:bg-gray-700 focus:ring-gray-500',
  };
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

const GeneratedOutput = ({ value, onRegenerate, onCopy, type }) => {
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(type !== 'Password');

  useEffect(() => {
    if (type !== 'Password') setShow(true);
    else setShow(false);
  }, [type, value]);

  const handleCopy = () => {
    const isError = value.includes('Select a character type!') || value.includes('Too long for no repeats!');
    if (!value || isError) return;

    navigator.clipboard.writeText(value);
    setCopied(true);
    if (onCopy) onCopy(value);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900/70 p-4 rounded-lg space-y-4">
      <div className="relative flex items-center">
        <div className="flex-grow bg-gray-800 rounded-md p-3 pr-20 min-h-[52px] flex items-center">
          <span className={`text-lg md:text-xl font-mono break-all ${show ? 'text-gray-100' : 'text-transparent bg-gray-500 rounded-sm select-none'}`}>
            {show ? value : '•'.repeat(value.length)}
          </span>
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {type === 'Password' && (
            <Button onClick={() => setShow(s => !s)} variant="ghost" className="p-2">
              {show ? <EyeClosedIcon /> : <EyeOpenIcon />}
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={handleCopy} variant="secondary" className="w-full">
          {copied ? <><CheckIcon /><span>Copied!</span></> : <><CopyIcon /><span>Copy</span></>}
        </Button>
        <Button onClick={onRegenerate} className="w-full">
          <RefreshIcon /><span>Regenerate</span>
        </Button>
      </div>
    </div>
  );
};


// --- GENERATOR LOGIC & COMPONENTS ---

const PasswordGenerator = ({ onGenerate, onCopy }) => {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    lowercase: true,
    uppercase: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: true,
    noRepeats: false,
    mustInclude: true,
    startsWithLetter: false,
  });
  const [excludeCustom, setExcludeCustom] = useState('');
  const [password, setPassword] = useState('');
  const [entropy, setEntropy] = useState(0);

  const characterPool = useMemo(() => {
    let pool = '';
    if (options.lowercase) pool += LOWERCASE;
    if (options.uppercase) pool += UPPERCASE;
    if (options.digits) pool += DIGITS;
    if (options.symbols) pool += SYMBOLS;

    let finalPool = pool.split('');
    if (options.excludeAmbiguous) {
      finalPool = finalPool.filter(c => !AMBIGUOUS.includes(c));
    }
    if (excludeCustom) {
      finalPool = finalPool.filter(c => !excludeCustom.includes(c));
    }
    
    if (options.noRepeats) {
        return [...new Set(finalPool)];
    }
    return finalPool;
  }, [options, excludeCustom]);
  
  const generate = useCallback(() => {
    if (characterPool.length === 0) {
      setPassword('Select a character type!');
      setEntropy(0);
      return;
    }

    if (options.noRepeats && length > characterPool.length) {
      setPassword('Too long for no repeats!');
      setEntropy(0);
      return;
    }
    
    let pass = [];
    let tempPool = [...characterPool];
    
    // "Must Include" logic
    if (options.mustInclude) {
      const requiredChars = [];
      if (options.lowercase) requiredChars.push(LOWERCASE.split('').filter(c => tempPool.includes(c)));
      if (options.uppercase) requiredChars.push(UPPERCASE.split('').filter(c => tempPool.includes(c)));
      if (options.digits) requiredChars.push(DIGITS.split('').filter(c => tempPool.includes(c)));
      if (options.symbols) requiredChars.push(SYMBOLS.split('').filter(c => tempPool.includes(c)));

      for (const charSet of requiredChars) {
        if(charSet.length > 0) {
          pass.push(charSet[secureRandomNumber(charSet.length)]);
        }
      }
    }

    // Fill the rest of the password
    const remainingLength = length - pass.length;
    for (let i = 0; i < remainingLength; i++) {
        if (options.noRepeats) {
            const poolForSelection = tempPool.filter(c => !pass.includes(c));
            if (poolForSelection.length === 0) break;
            const randomIndex = secureRandomNumber(poolForSelection.length);
            pass.push(poolForSelection[randomIndex]);
        } else {
            const randomIndex = secureRandomNumber(tempPool.length);
            pass.push(tempPool[randomIndex]);
        }
    }
    
    pass = shuffleArray(pass);
    
    // "Starts With Letter" logic
    if (options.startsWithLetter && pass.length > 0) {
      const letters = (LOWERCASE + UPPERCASE).split('');
      if (!letters.includes(pass[0])) {
        const letterIndex = pass.findIndex(c => letters.includes(c));
        if (letterIndex !== -1) {
          [pass[0], pass[letterIndex]] = [pass[letterIndex], pass[0]];
        }
      }
    }

    const finalPassword = pass.slice(0, length).join('');
    setPassword(finalPassword);
    
    const poolSize = characterPool.length;
    const calculatedEntropy = length * Math.log2(poolSize);
    setEntropy(isFinite(calculatedEntropy) ? Math.floor(calculatedEntropy) : 0);

    onGenerate(finalPassword, 'Password');

  }, [length, options, characterPool, onGenerate]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleOptionChange = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const setPreset = (preset) => {
    switch (preset) {
        case 'balanced':
            setLength(16);
            setOptions({ lowercase: true, uppercase: true, digits: true, symbols: true, excludeAmbiguous: true, noRepeats: false, mustInclude: true, startsWithLetter: true });
            break;
        case 'strong':
            setLength(32);
            setOptions({ lowercase: true, uppercase: true, digits: true, symbols: true, excludeAmbiguous: true, noRepeats: false, mustInclude: true, startsWithLetter: true });
            break;
        case 'paranoid':
            setLength(64);
            setOptions({ lowercase: true, uppercase: true, digits: true, symbols: true, excludeAmbiguous: true, noRepeats: true, mustInclude: true, startsWithLetter: true });
            break;
    }
  };

  const strength = useMemo(() => {
    if (entropy < 40) return { label: 'Weak', color: 'bg-red-500', width: '20%' };
    if (entropy < 60) return { label: 'Moderate', color: 'bg-orange-500', width: '40%' };
    if (entropy < 80) return { label: 'Strong', color: 'bg-yellow-500', width: '60%' };
    if (entropy < 100) return { label: 'Very Strong', color: 'bg-green-500', width: '80%' };
    return { label: 'Insane', color: 'bg-emerald-500', width: '100%' };
  }, [entropy]);

  return (
    <div className="space-y-6">
      <GeneratedOutput value={password} onRegenerate={generate} onCopy={onCopy} type="Password" />
      <div className="bg-gray-800/50 p-6 rounded-lg space-y-6">
        <Slider label="Length" value={length} min={4} max={128} onChange={e => setLength(parseInt(e.target.value))} unit="chars" />
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-300">Strength ({entropy} bits)</h3>
            <span className={`text-sm font-semibold ${strength.label.toLowerCase().replace(' ','-')}`}>{strength.label}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <motion.div
              className={`h-2.5 rounded-full ${strength.color}`}
              initial={{ width: 0 }}
              animate={{ width: strength.width }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            ></motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button onClick={() => setPreset('balanced')} variant="secondary">Balanced</Button>
            <Button onClick={() => setPreset('strong')} variant="secondary">Strong</Button>
            <Button onClick={() => setPreset('paranoid')} variant="secondary">Paranoid</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Checkbox label="Lowercase" checked={options.lowercase} onChange={() => handleOptionChange('lowercase')} tooltipText="Include a-z" />
          <Checkbox label="Uppercase" checked={options.uppercase} onChange={() => handleOptionChange('uppercase')} tooltipText="Include A-Z" />
          <Checkbox label="Digits" checked={options.digits} onChange={() => handleOptionChange('digits')} tooltipText="Include 0-9" />
          <Checkbox label="Symbols" checked={options.symbols} onChange={() => handleOptionChange('symbols')} tooltipText="Include !@#$%..." />
        </div>
        <hr className="border-gray-700" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Checkbox label="Start with letter" checked={options.startsWithLetter} onChange={() => handleOptionChange('startsWithLetter')} tooltipText="First character must be a letter" />
          <Checkbox label="No repeats" checked={options.noRepeats} onChange={() => handleOptionChange('noRepeats')} tooltipText="Each character appears only once" />
          <Checkbox label="Must include each" checked={options.mustInclude} onChange={() => handleOptionChange('mustInclude')} tooltipText="Ensure at least one character from each selected set" />
          <Checkbox label="Exclude ambiguous" checked={options.excludeAmbiguous} onChange={() => handleOptionChange('excludeAmbiguous')} tooltipText="Exclude characters like O, 0, l, I, |" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Exclude custom characters</label>
          <input
            type="text"
            value={excludeCustom}
            onChange={e => setExcludeCustom(e.target.value)}
            placeholder="e.g., {}[]()"
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

const PinGenerator = ({ onGenerate, onCopy }) => {
  const [length, setLength] = useState(4);
  const [pin, setPin] = useState('');

  const generate = useCallback(() => {
    let newPin = '';
    for (let i = 0; i < length; i++) {
      newPin += DIGITS[secureRandomNumber(DIGITS.length)];
    }
    setPin(newPin);
    onGenerate(newPin, 'PIN');
  }, [length, onGenerate]);
  
  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <div className="space-y-6">
      <GeneratedOutput value={pin} onRegenerate={generate} onCopy={onCopy} type="PIN" />
      <div className="bg-gray-800/50 p-6 rounded-lg space-y-6">
        <Slider label="Length" value={length} min={1} max={12} onChange={e => setLength(parseInt(e.target.value))} unit="digits" />
      </div>
    </div>
  );
};

const PassphraseGenerator = ({ onGenerate, onCopy }) => {
  const [words, setWords] = useState(4);
  const [separator, setSeparator] = useState('-');
  const [options, setOptions] = useState({
    capitalize: true,
    addNumber: true,
    addSymbol: false,
  });
  const [passphrase, setPassphrase] = useState('');

  const generate = useCallback(() => {
    let phrase = [];
    const shuffledWords = shuffleArray(WORD_LIST);
    for (let i = 0; i < words; i++) {
      phrase.push(shuffledWords[i % shuffledWords.length]);
    }

    if (options.capitalize) {
      phrase = phrase.map(w => w.charAt(0).toUpperCase() + w.slice(1));
    }

    let finalPhrase = phrase.join(separator);

    if (options.addNumber) {
      finalPhrase += secureRandomNumber(10);
    }
    if (options.addSymbol) {
      finalPhrase += SYMBOLS[secureRandomNumber(SYMBOLS.length)];
    }
    
    setPassphrase(finalPhrase);
    onGenerate(finalPhrase, 'Passphrase');
  }, [words, separator, options, onGenerate]);

  useEffect(() => {
    generate();
  }, [generate]);
  
  const handleOptionChange = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <GeneratedOutput value={passphrase} onRegenerate={generate} onCopy={onCopy} type="Passphrase" />
      <div className="bg-gray-800/50 p-6 rounded-lg space-y-6">
        <Slider label="Number of words" value={words} min={2} max={12} onChange={e => setWords(parseInt(e.target.value))} />
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Separator</label>
          <input
            type="text"
            value={separator}
            onChange={e => setSeparator(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Checkbox label="Capitalize" checked={options.capitalize} onChange={() => handleOptionChange('capitalize')} tooltipText="Capitalize the first letter of each word" />
          <Checkbox label="Add number" checked={options.addNumber} onChange={() => handleOptionChange('addNumber')} tooltipText="Append a random number to the end" />
          <Checkbox label="Add symbol" checked={options.addSymbol} onChange={() => handleOptionChange('addSymbol')} tooltipText="Append a random symbol to the end" />
        </div>
      </div>
    </div>
  );
};

const History = ({ history, onClear, onCopy }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 5000); // Update every 5 seconds
        return () => clearInterval(timer);
    }, []);

    const copyFromHistory = (value) => {
        navigator.clipboard.writeText(value);
        onCopy(value);
    };

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-200">History</h2>
                {history.length > 0 && (
                    <Button onClick={onClear} variant="secondary">
                        <TrashIcon /><span>Clear All</span>
                    </Button>
                )}
            </div>
            {history.length === 0 ? (
                <div className="text-center text-gray-500 bg-gray-800/50 p-6 rounded-lg">
                    Your generated items will appear here.
                </div>
            ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {history.map((item) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-gray-800/50 p-3 rounded-lg flex items-center justify-between"
                        >
                            <div className="flex-grow mr-4">
                                <p className="font-mono text-gray-300 truncate">{item.value}</p>
                                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-white ${
                                        item.type === 'Password' ? 'bg-blue-500' :
                                        item.type === 'PIN' ? 'bg-green-500' : 'bg-purple-500'
                                    }`}>{item.type}</span>
                                    <span>{timeAgo(new Date(item.timestamp))}</span>
                                </div>
                            </div>
                            <Button onClick={() => copyFromHistory(item.value)} variant="ghost" className="p-2">
                                <CopyIcon />
                            </Button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- MAIN APP COMPONENT ---

const App = () => {
  const [activeTab, setActiveTab] = useState('Password');
  const [history, setHistory] = useState([]);
  const [copiedNotification, setCopiedNotification] = useState('');

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('passwordForgeHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('passwordForgeHistory', JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  }, [history]);

  const addToHistory = useCallback((value, type) => {
    setHistory(prev => {
      const newItem = { id: Date.now(), value, type, timestamp: new Date().toISOString() };
      const newHistory = [newItem, ...prev];
      return newHistory.slice(0, 50); // Keep only last 50
    });
  }, []);
  
  const clearHistory = () => {
    setHistory([]);
  };

  const showCopiedNotification = (value) => {
    setCopiedNotification(value);
    setTimeout(() => setCopiedNotification(''), 2000);
  };

  const tabs = ['Password', 'PIN', 'Passphrase'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black flex items-start justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8 space-y-2">
            <div className="flex items-center justify-center space-x-4">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                    Password Forge
                </h1>
                <Tooltip text="All generation happens on your device. Nothing is ever sent to a server.">
                    <div className="bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1 rounded-full border border-green-400">
                        Local Only
                    </div>
                </Tooltip>
            </div>
            <p className="text-gray-400">Generate secure, random passwords, PINs, and passphrases offline.</p>
        </header>

        <main className="bg-gray-800/30 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 sm:p-6 shadow-2xl shadow-black/30">
          <div className="mb-6">
            <div className="flex border-b border-gray-700">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative py-3 px-4 sm:px-6 text-sm sm:text-base font-medium transition-colors ${
                    activeTab === tab ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                      layoutId="underline"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'Password' && <PasswordGenerator onGenerate={addToHistory} onCopy={showCopiedNotification} />}
              {activeTab === 'PIN' && <PinGenerator onGenerate={addToHistory} onCopy={showCopiedNotification} />}
              {activeTab === 'Passphrase' && <PassphraseGenerator onGenerate={addToHistory} onCopy={showCopiedNotification} />}
            </motion.div>
          </AnimatePresence>
          <History history={history} onClear={clearHistory} onCopy={showCopiedNotification} />
        </main>
        
        <footer className="text-center mt-8 text-sm text-gray-500">
            <p>Built for privacy and security. Your data never leaves your device.</p>
        </footer>

        <AnimatePresence>
            {copiedNotification && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.3 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-semibold flex items-center space-x-2"
                >
                    <CheckIcon />
                    <span>Copied to clipboard!</span>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);