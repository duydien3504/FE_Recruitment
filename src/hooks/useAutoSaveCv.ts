import { useEffect, useRef, useState, useCallback } from 'react';
import { useCvStore } from '../store/cvStore';
import { CvService } from '../services/cv.service';
import debounce from 'lodash/debounce';

export const useAutoSaveCv = () => {
    const { cvData, themeConfig, templateId, setCvData, updateTheme, setAtsScore, setTemplateId } = useCvStore();
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    
    // Giữ reference trỏ tới data mới nhất
    const latestData = useRef({ cvData, themeConfig, templateId });
    const isFirstMount = useRef(true);

    // 1. Initial Load - GET Bản nháp (Chạy 1 lần duy nhất khi Mount)
    useEffect(() => {
        const fetchInitialDraft = async () => {
            try {
                const response = await CvService.getDraft();
                if (response.success && response.data) {
                    setCvData(response.data.cvData || {});
                    if (response.data.themeConfig) {
                        updateTheme(response.data.themeConfig);
                    }
                    if (response.data.templateId) {
                        setTemplateId(response.data.templateId);
                    }
                    if (response.data.atsScore !== undefined) {
                        setAtsScore(response.data.atsScore);
                    }
                }
            } catch (error) {
                console.error("Lỗi khi fetch bản nháp CV:", error);
            } finally {
                setIsInitialLoad(false);
            }
        };
        fetchInitialDraft();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2. Luôn đồng bộ state mới nhất vào ref
    useEffect(() => {
        latestData.current = { cvData, themeConfig, templateId };
    }, [cvData, themeConfig, templateId]);

    // 3. Hàm gọi API bọc bằng lodash debounce (tránh gọi nhiều lần)
    // Lưu ý: Không đưa dependencies store vào đây để tránh tạo lại hàm re-render
    const saveToBackend = useCallback(
        debounce(async (payloadObj) => {
            setIsSaving(true);
            try {
                const res = await CvService.updateDraft(payloadObj);
                if (res && res.success) {
                    if (res.newAtsScore !== undefined) {
                        setAtsScore(res.newAtsScore);
                    }
                    setLastSaved(new Date());
                }
            } catch (error) {
                console.error("Lỗi Auto-save:", error);
            } finally {
                setIsSaving(false);
            }
        }, 800), // Rút ngắn chờ đợi xuống còn 0.8s
        [setAtsScore]
    );

    // 4. Lắng nghe thay đổi CV để đẩy vào hàm debounced
    useEffect(() => {
        if (isInitialLoad || isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        
        saveToBackend(latestData.current);
    }, [cvData, themeConfig, templateId, isInitialLoad, saveToBackend]);

    // 5. CỰC KỲ QUAN TRỌNG: Trigger Flush ép lưu ngay lập tức nếu user tắt tab hoặc rời trang
    useEffect(() => {
        const handleBeforeUnload = () => {
            saveToBackend.flush();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            saveToBackend.flush(); // Bắn Request vét cạn trước khi Component Unmount
        };
    }, [saveToBackend]);

    return { isSaving, lastSaved, isInitialLoad };
};
