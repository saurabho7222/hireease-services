export type Profile={userId:string;email:string;name:string;address:string;city:string;country:string;education:string;institution:string;graduationYear:string;skills:string[];experience:string;resumeName:string|null;hasResume:boolean;updatedAt:string};
export type Application={id:string;jobId:string;jobTitle:string;company:string;isSample:boolean;status:string;createdAt:string;updatedAt:string;profile?:Profile};
export const statusLabels:Record<string,string>={submitted:'Submitted',review:'Under review',interview:'Interview',selected:'Selected',not_selected:'Not selected'};
