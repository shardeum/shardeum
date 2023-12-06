import { NetworkParameters } from "../dao/types";

export interface DaoConfig {
    daoAccount: string,
    TIME_FOR_PROPOSALS: number,
    TIME_FOR_VOTING: number,
    TIME_FOR_GRACE: number,
    TIME_FOR_APPLY: number,
    TIME_FOR_DEV_PROPOSALS: number,
    TIME_FOR_DEV_VOTING: number,
    TIME_FOR_DEV_GRACE: number,
    TIME_FOR_DEV_APPLY: number,
    INITIAL_PARAMETERS: NetworkParameters,
}
