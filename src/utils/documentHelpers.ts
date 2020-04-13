const scrollToTop = (): void => {
    // For Safari.
    document.body.scrollTop = 0;
    // For Chrome, Firefox, IE and Opera};
    document.documentElement.scrollTop = 0;
};

const scrollToTargetAdjusted = (targetIdOrHash: string, offset: number): void => {
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

export default scrollToTargetAdjusted;
