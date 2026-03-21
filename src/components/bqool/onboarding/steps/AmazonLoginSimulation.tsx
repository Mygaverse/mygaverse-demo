export const AmazonLoginSimulation = ({ onLoginSuccess, onCancel }: any) => (
  <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center backdrop-blur-sm">
    <div className="bg-white rounded shadow-2xl w-[400px] overflow-hidden">
        {/* Fake Browser Header */}
        <div className="bg-[#232f3e] px-4 py-2 flex items-center justify-between">
            <span className="text-white text-xs">Amazon Seller Central</span>
            <button onClick={onCancel} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <div className="p-8 flex flex-col items-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" className="w-24 mb-6" />
            
            <div className="w-full border rounded p-6 space-y-4">
                <h2 className="text-xl font-normal mb-2">Sign-In</h2>
                <div>
                    <label className="block text-xs font-bold mb-1">Email or mobile phone number</label>
                    <input type="text" className="w-full border rounded px-2 py-1" defaultValue="demo@bqool.com" />
                </div>
                <div>
                    <div className="flex justify-between">
                        <label className="block text-xs font-bold mb-1">Password</label>
                        <a href="#" className="text-xs text-blue-600">Forgot password?</a>
                    </div>
                    <input type="password" className="w-full border rounded px-2 py-1" defaultValue="password123" />
                </div>
                <button 
                    onClick={onLoginSuccess}
                    className="w-full bg-[#f0c14b] border border-[#a88734] rounded py-1 text-sm shadow-sm hover:bg-[#ddb347]"
                >
                    Sign-In
                </button>
            </div>
        </div>
    </div>
  </div>
);