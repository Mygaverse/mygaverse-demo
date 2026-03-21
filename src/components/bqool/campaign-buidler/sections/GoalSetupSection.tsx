'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/bqool/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/bqool/firebase';

import { StoreSelector } from "../../ui/StoreSelector";
import { SingleSelect } from "../../ui/SingleSelect";
import { ExclamationTriangleFill } from 'react-bootstrap-icons';
import { useCampaignBuilder } from '../data/CampaignBuilderContext';

export const GoalSetupSection = () => {
    const { user } = useAuth();
    const { 
        storeId, setStoreId, 
        goalName, setGoalName, 
        adType, setAdType 
    } = useCampaignBuilder();

    const [touched, setTouched] = useState(false);
    const hasError = touched && goalName.length === 0;

    // Load Default Store (Simulating parent logic inside context consumer if needed)
    useEffect(() => {
        const init = async () => {
            if(!user || storeId) return; // Skip if already set
            const u = await getDoc(doc(db, 'users', user.uid));
            if(u.exists() && u.data().defaultStoreId) setStoreId(u.data().defaultStoreId);
        }
        init();
    }, [user, storeId, setStoreId]);

    // StoreSelector requires array, context uses string. Bridge it:
    const handleStoreSelect = (ids: string[]) => {
        if(ids.length > 0) setStoreId(ids[0]);
    };

    return (
        <div id="setup" className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm mb-6">
            <div className="px-6 py-4 border-b border-[#e2e2e2] font-bold text-gray-900 text-md">
                Goal Setup
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center h-[48px] z-20 relative">
                    <div className="h-full z-30 relative">
                        <StoreSelector 
                            mode="single" 
                            selectedStoreIds={storeId ? [storeId] : []} 
                            onSelect={handleStoreSelect} 
                        />
                    </div>
                    <div className="h-full w-[250px] ">
                        <SingleSelect 
                            label="Ad Type" 
                            value={adType} 
                            options={['Sponsored Products', 'Sponsored Brands', 'Sponsored Display']} 
                            onChange={setAdType} 
                            disabled={true}  
                            triggerClassName="rounded-r-md border border-[#e2e2e2]"
                         />
                    </div>
                </div>

                <div className='flex gap-2 h-full relative z-10'>
                    <div className="text-md font-medium text-gray-700 w-[100px]">Goal Name</div>
                    <div className='flex flex-col justify-start w-full'>
                        <input 
                            type="text" 
                            value={goalName}
                            onChange={(e) => setGoalName(e.target.value)}
                            onBlur={() => setTouched(true)}
                            className={`w-full h-[48px] border ${hasError ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#4aaada]`}
                            placeholder="Enter goal name"
                        />
                        {hasError && (
                            <div className="flex items-center gap-2 text-red-500 text-xs mt-2">
                                <ExclamationTriangleFill /> Please enter a goal name with a maximum of 100 characters.
                            </div>
                        )}
                    </div>
                    
                </div>
            </div>
        </div>
    );
};