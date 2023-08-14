import React, {FC, ReactNode, useState} from "react";
import {createRecordContext, RecordContext} from "@/lib/hooks/use-records";

export interface RecordProviderProps {
    children: ReactNode;
}
export const RecordProvider: FC<RecordProviderProps> = ({ children, ...props }) => {
    return (
        <RecordContext.Provider value={createRecordContext()}>
            {children}
        </RecordContext.Provider>
    );
};
