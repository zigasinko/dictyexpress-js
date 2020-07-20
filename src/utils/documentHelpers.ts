const scrollToTop = (): void => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
};

export const scrollToTargetAdjusted = (targetIdOrHash: string, offset: number): void => {
    if (targetIdOrHash == null || targetIdOrHash === '') {
        scrollToTop();
    }

    const targetId = targetIdOrHash.replace('#', '');
    const element = document.getElementById(targetId);
    if (element == null) {
        return;
    }
    const elementPosition = element.offsetTop;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
    });
};

export const getCookie = (name: string): string => {
    let cookieValue = '';
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i += 1) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.startsWith(name)) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

export const setClipboardText = (text: string): void => {
    navigator.clipboard.writeText(text);
};
