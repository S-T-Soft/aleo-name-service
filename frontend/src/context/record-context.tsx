import React, {FC, ReactNode} from "react";
import {useRecordContext, RecordContext} from "@/lib/hooks/use-records";

export interface RecordProviderProps {
    children: ReactNode;
}
export const RecordProvider: FC<RecordProviderProps> = ({ children, ...props }) => {
    return (
        <RecordContext.Provider value={useRecordContext()}>
            {children}
        </RecordContext.Provider>
    );
};
