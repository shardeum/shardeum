import { initAjvSchemas, verifyPayload } from '../../../../../src/types/ajv/Helpers';
import { AJVSchemaEnum } from '../../../../../src/types/enum/AJVSchemaEnum';
import { initializeSerialization } from '../../../../../src/utils/serialization/SchemaHelpers';
describe('PenaltyTX AJV tests', () => {
    beforeAll(() => {
        initAjvSchemas();
        initializeSerialization();
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Valid object positive case', () => {
        const obj = {
            internalTXType: 12,
            isInternalTx: true,
            operatorEVMAddress: '0x2f97a188a40dcceb533f47a8dabe24b0e165d569',
            reportedNodeId: '9db68adb8b550cb215607c6aafea9b42ec67bc8bf3b6ae36c48c7e490d484fda',
            reportedNodePublickKey: '4cc0375f00817f70eb88a7191eddb9cabd6730adfe69afc43517894d2c2e112a',
            sign: { owner: '61f529902152b2f87afce2743eefab1ed18a7eefacdefdfd7826e7c5b11911a5', sig: '6ba8db8f5bbd2b28a1f1e7f607df3600fc33384e71514121a96ca9f22262ec3feaabd38bd830521ce4a1da6051df60c410ee2309e217a11f66f03a287652ce08d930feab7950c93070a5dce9d105c06772021f4a0b9b6965369b357a7a501968' },
            timestamp: 1730816913000,
            violationData: { nodeDroppedCycle: 82, nodeDroppedTime: 1730816853, nodeLostCycle: 81 },
            violationType: 1000,
        };
        const errors = verifyPayload(AJVSchemaEnum.PenaltyTx, obj);
        expect(errors).toBeNull();
    });
    test('Valid object negative case', () => {
        const obj = {
            internalTXType: 12,
            isInternalTx: true,
            operatorEVMAddress: '0x2f97a188a40dcceb533f47a8dabe24b0e165d569',
            reportedNodeId: '9db8adb8b550cb215607c6aafea9b42ec67bc8bf3b6ae36c48c7e490d484fda',
            reportedNodePublickKey: '4cc0375f00817f70eb88a7191eddb9cabd6730adfe69afc43517894d2c2e112a',
            sign: { owner: '61f529902152b2f87afce2743eefab1ed18a7eefacdefdfd7826e7c5b11911a5', sig: '6ba8db8f5bbd2b28a1f1e7f607df3600fc33384e71514121a96ca9f22262ec3feaabd38bd830521ce4a1da6051df60c410ee2309e217a11f66f03a287652ce08d930feab7950c93070a5dce9d105c06772021f4a0b9b6965369b357a7a501968' },
            timestamp: 1730816913000,
            violationData: { nodeDroppedCycle: 82, nodeDroppedTime: 1730816853, nodeLostCycle: 81 },
            violationType: 1000,
        };
        const errors = verifyPayload(AJVSchemaEnum.PenaltyTx, obj);
        expect(errors).not.toBeNull();
        expect(errors?.length).toBe(1);
    });
});