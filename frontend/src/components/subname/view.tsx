import React, {useEffect, useState} from "react";
import Button from "@/components/ui/button";
import { Record } from "@/types";
import AddSubName from "@/components/subname/addSubName";
import AnchorLink from "@/components/ui/links/anchor-link";
import {useClient} from "@/lib/hooks/use-client";
import {useBoolean} from "react-use";
import {useRecords} from "@/lib/hooks/use-records";


export default function SubNameView({record, ...props}: { record: Record }) {
  const {getSubNames} = useClient();
  const {namesHash} = useRecords();
  const [loading, setLoading] = useBoolean(true);
  const [refresh, setRefresh] = useState(0);
  const [subnames, setSubnames] = useState<Record[]>([]);

  useEffect(() => {
    if (record) {
      setLoading(true);
      getSubNames(record.name).then((subnames) => {
        setSubnames(subnames);
      }).finally(() => {
        setLoading(false);
      })
    }
  }, [record, refresh]);

  const doRefresh = () => {
    setRefresh(refresh + 1);
  }

  return (
    <div className="relative mx-auto w-full max-w-full"
         {...props}
    >
      {record && <AddSubName record={record} onSuccess={doRefresh} />}
      <div className="mt-5 border-t-[1px] border-t-gray-500 flex justify-end">
        <table className="table-fixed w-full rounded-lg px-5">
            <thead>
              <tr className="h-14">
                <th>Aleo Name</th>
                <th className="w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={2} className="text-center">Loading...</td></tr>}
              {!loading && subnames.length == 0 && <tr>
                  <td colSpan={2} className="text-center">
                      No subnames have been added
                  </td>
              </tr>}
              {!loading && subnames.length > 0 && subnames.map((subName, index) => (
                <tr key={index} className="h-16 hover:bg-gray-700">
                  <td className="pl-5">
                    <span className="font-bold">{subName.name}</span><span className="text-gray-400 hidden md:inline">.{record.name}</span>
                    {subName.private && <span className="bg-gray-600 mx-3 px-2 py-1 rounded-lg">Private</span>}
                    {!subName.private && <span className="bg-gray-600 mx-3 px-2 py-1 rounded-lg">Public</span>}
                  </td>
                  <td className="text-center">
                    {(namesHash || []).includes(subName.nameHash!) && <AnchorLink href={`/account/${subName.name}.${record.name}`}>
                      <Button className="px-4 py-1 h-8 sm:h-8 sm:px-4">
                        Manage
                      </Button>
                    </AnchorLink>}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
