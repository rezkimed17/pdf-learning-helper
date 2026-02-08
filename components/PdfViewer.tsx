interface PdfViewerProps {
    url: string;
    page?: number;
    className?: string;
}

export function PdfViewer({ url, page = 1, className }: PdfViewerProps) {
    // Append #page=N to URL for browser native PDF viewer navigation
    const viewerUrl = `${url}#page=${page}&view=FitH`;

    return (
        <div className={`w-full h-full bg-gray-100 ${className}`}>
            <iframe
                src={viewerUrl}
                className="w-full h-full border-0"
                title="PDF Viewer"
            />
        </div>
    );
}
