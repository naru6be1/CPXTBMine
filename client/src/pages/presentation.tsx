import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Menu, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Home,
  Wallet,
  QrCode,
  CreditCard,
  Database,
  Shield,
  FileText,
  CheckCircle,
  Loader2
} from 'lucide-react';

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const presentationRef = useRef<HTMLDivElement>(null);
  
  // Define image URLs for slides
  const imageUrls = {
    platform: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjYyNjJmIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI4MCIgZmlsbD0iIzBmODRmZiIgZmlsbC1vcGFjaXR5PSIwLjciLz48cGF0aCBkPSJNMTQwIDEzMEwxODAgOTBMMjIwIDE0MEwyNjAgOTBMMzAwIDEzMEwyNjAgMTcwTDIyMCAxMzBMMTgwIDE3MEwxNDAgMTMwWiIgZmlsbD0id2hpdGUiLz48dGV4dCB4PSIyMDAiIHk9IjIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q1BYVEIgUGxhdGZvcm08L3RleHQ+PC9zdmc+",
    overview: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTUwIiByPSI3MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGY4NGZmIiBzdHJva2Utd2lkdGg9IjMiLz48cG9seWdvbiBwb2ludHM9IjIwMCw4MCAxMjAsMTgwIDI4MCwxODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBmODRmZiIgc3Ryb2tlLXdpZHRoPSIzIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iODAiIHI9IjEwIiBmaWxsPSIjMGY4NGZmIi8+PGNpcmNsZSBjeD0iMTIwIiBjeT0iMTgwIiByPSIxMCIgZmlsbD0iIzBmODRmZiIvPjxjaXJjbGUgY3g9IjI4MCIgY3k9IjE4MCIgcj0iMTAiIGZpbGw9IiMwZjg0ZmYiLz48dGV4dCB4PSIyMDAiIHk9IjI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QmxvY2tjaGFpbiBQYXltZW50cyBPdmVydmlldzwvdGV4dD48L3N2Zz4=",
    merchant: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDkwOTBiIi8+PHJlY3QgeD0iMTAwIiB5PSI1MCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxNTAiIHJ4PSIxMCIgcnk9IjEwIiBmaWxsPSIjMjgzMjNhIiBzdHJva2U9IiMwZjg0ZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjEyMCIgeT0iNzAiIHdpZHRoPSIxNjAiIGhlaWdodD0iMjAiIHJ4PSI1IiByeT0iNSIgZmlsbD0iIzRjNTY2NCIvPjxyZWN0IHg9IjEyMCIgeT0iMTAwIiB3aWR0aD0iODAiIGhlaWdodD0iMjAiIHJ4PSI1IiByeT0iNSIgZmlsbD0iIzRjNTY2NCIvPjxyZWN0IHg9IjEyMCIgeT0iMTMwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjIwIiByeD0iNSIgcnk9IjUiIGZpbGw9IiM0YzU2NjQiLz48Y2lyY2xlIGN4PSIyNTAiIGN5PSIxNzAiIHI9IjIwIiBmaWxsPSIjMGY4NGZmIi8+PHRleHQgeD0iMjUwIiB5PSIxNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdvPC90ZXh0Pjx0ZXh0IHg9IjIwMCIgeT0iMjI1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5NZXJjaGFudCBPbmJvYXJkaW5nPC90ZXh0Pjwvc3ZnPg==",
    dashboard: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYxNjI5Ii8+PHJlY3QgeD0iMzAiIHk9IjMwIiB3aWR0aD0iMzQwIiBoZWlnaHQ9IjI0MCIgcng9IjUiIHJ5PSI1IiBmaWxsPSIjMTcyMTNhIiBzdHJva2U9IiMzOTNmNGEiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjE0MCIgaGVpZ2h0PSI4MCIgcng9IjUiIHJ5PSI1IiBmaWxsPSIjMjMzMTUyIiBzdHJva2U9IiMwZjg0ZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjIxMCIgeT0iNTAiIHdpZHRoPSIxNDAiIGhlaWdodD0iODAiIHJ4PSI1IiByeT0iNSIgZmlsbD0iIzIzMzE1MiIgc3Ryb2tlPSIjMGY4NGZmIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSI1MCIgeT0iMTUwIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgcng9IjUiIHJ5PSI1IiBmaWxsPSIjMjMzMTUyIiBzdHJva2U9IiMwZjg0ZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik03MCAxOTAgTDEwMCAxNzAgTDEzMCAxOTAgTDE2MCAxNjAgTDE5MCAxODAgTDIyMCAxNjAgTDI1MCAxOTAgTDI4MCAxNzAgTDMxMCAxOTAgTDM0MCAxNzAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBmODRmZiIgc3Ryb2tlLXdpZHRoPSIzIi8+PHRleHQgeD0iMjAwIiB5PSIyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk1lcmNoYW50IERhc2hib2FyZDwvdGV4dD48L3N2Zz4=",
    payment: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYxNjI5Ii8+PHJlY3QgeD0iNTAiIHk9IjUwIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgcng9IjUiIHJ5PSI1IiBmaWxsPSIjMTcyMTNhIiBzdHJva2U9IiMzOTNmNGEiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjcwIiB5PSI4MCIgd2lkdGg9IjI2MCIgaGVpZ2h0PSI0MCIgcng9IjUiIHJ5PSI1IiBmaWxsPSIjMjMzMTUyIiBzdHJva2U9IiMwZjg0ZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjcwIiB5PSIxMzAiIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIHJ4PSI1IiByeT0iNSIgZmlsbD0iIzIzMzE1MiIgc3Ryb2tlPSIjMGY4NGZmIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSIyMTAiIHk9IjEzMCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSI0MCIgcng9IjUiIHJ5PSI1IiBmaWxsPSIjMjMzMTUyIiBzdHJva2U9IiMwZjg0ZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjIyMCIgeT0iMTkwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9IjQwIiByeD0iNSIgcnk9IjUiIGZpbGw9IiMwZjg0ZmYiLz48dGV4dCB4PSIyNzUiIHk9IjIxNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q3JlYXRlIFBheW1lbnQ8L3RleHQ+PHRleHQgeD0iMjAwIiB5PSIyNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlBheW1lbnQgUmVxdWVzdCBDcmVhdGlvbjwvdGV4dD48L3N2Zz4=",
    customer: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYxNjI5Ii8+PHJlY3QgeD0iMTAwIiB5PSI1MCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHJ4PSI1IiByeT0iNSIgZmlsbD0iIzE3MjEzYSIgc3Ryb2tlPSIjMzk0ZjVhIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSIxMjAiIHk9IjcwIiB3aWR0aD0iMTYwIiBoZWlnaHQ9IjQwIiByeD0iNSIgcnk9IjUiIGZpbGw9IiMyMzMxNTIiLz48dGV4dCB4PSIyMDAiIHk9Ijk1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QYXltZW50IEFtb3VudDogJDk5Ljk5PC90ZXh0PjxyZWN0IHg9IjEyMCIgeT0iMTMwIiB3aWR0aD0iMTYwIiBoZWlnaHQ9IjgwIiByeD0iNSIgcnk9IjUiIGZpbGw9IiMwMDAwMDAiIHN0cm9rZT0iIzBmODRmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMTMwIiB5PSIxNDAiIHdpZHRoPSIxNDAiIGhlaWdodD0iNjAiIHJ4PSIzIiByeT0iMyIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjE0MCIgeT0iMTUwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiByeD0iMiIgcnk9IjIiIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB4PSIxNTAiIHk9IjE2MCIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiByeD0iMiIgcnk9IjIiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB4PSIxODAiIHk9IjE2MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjQiIHJ4PSIxIiByeT0iMSIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjE4MCIgeT0iMTcwIiB3aWR0aD0iNDAiIGhlaWdodD0iNCIgcng9IjEiIHJ5PSIxIiBmaWxsPSIjZmZmZmZmIi8+PHJlY3QgeD0iMTgwIiB5PSIxODAiIHdpZHRoPSIzMCIgaGVpZ2h0PSI0IiByeD0iMSIgcnk9IjEiIGZpbGw9IiNmZmZmZmYiLz48cmVjdCB4PSIxNDAiIHk9IjIxMCIgd2lkdGg9IjEyMCIgaGVpZ2h0PSIzMCIgcng9IjUiIHJ5PSI1IiBmaWxsPSIjMGY4NGZmIi8+PHRleHQgeD0iMjAwIiB5PSIyMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlBheSB3aXRoIENQWFRCPC90ZXh0Pjx0ZXh0IHg9IjIwMCIgeT0iMjcwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DdXN0b21lciBQYXltZW50IFZpZXc8L3RleHQ+PC9zdmc+",
    paypal: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYxNjI5Ii8+PHJlY3QgeD0iMTAwIiB5PSI1MCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHJ4PSI1IiByeT0iNSIgZmlsbD0iIzE3MjEzYSIgc3Ryb2tlPSIjMzk0ZjVhIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSIxMjAiIHk9IjcwIiB3aWR0aD0iMTYwIiBoZWlnaHQ9IjQwIiByeD0iNSIgcnk9IjUiIGZpbGw9IiMyMzMxNTIiLz48dGV4dCB4PSIyMDAiIHk9Ijk1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QdXJjaGFzZSBDUFhUQiBUb2tlbnM8L3RleHQ+PHJlY3QgeD0iMTQwIiB5PSIxMzAiIHdpZHRoPSIxMjAiIGhlaWdodD0iMzUiIHJ4PSI1IiByeT0iNSIgZmlsbD0iIzAwOGNkZCIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUzIiBmb250LWZhbWlseT0iQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QYXlQYWw8L3RleHQ+PHJlY3QgeD0iMTQwIiB5PSIxODUiIHdpZHRoPSIxMjAiIGhlaWdodD0iMzAiIHJ4PSI1IiByeT0iNSIgZmlsbD0iIzBmODRmZiIvPjx0ZXh0IHg9IjIwMCIgeT0iMjA1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CdXkgVG9rZW5zPC90ZXh0Pjx0ZXh0IHg9IjIwMCIgeT0iMjcwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QYXlQYWwgSW50ZWdyYXRpb248L3RleHQ+PC9zdmc+",
    architecture: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYxNjI5Ii8+PHJlY3QgeD0iMTIwIiB5PSI1MCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSI0MCIgcng9IjUiIHJ5PSI1IiBmaWxsPSIjMGY4NGZmIiBmaWxsLW9wYWNpdHk9IjAuNyIvPjx0ZXh0IHg9IjIwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkZyb250ZW5kIChSZWFjdCk8L3RleHQ+PHJlY3QgeD0iMTIwIiB5PSIxMDAiIHdpZHRoPSIxNjAiIGhlaWdodD0iNDAiIHJ4PSI1IiByeT0iNSIgZmlsbD0iIzIzN2ZiNiIgZmlsbC1vcGFjaXR5PSIwLjciLz48dGV4dCB4PSIyMDAiIHk9IjEyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QmFja2VuZCAoRXhwcmVzcyk8L3RleHQ+PHJlY3QgeD0iMTIwIiB5PSIxNTAiIHdpZHRoPSIxNjAiIGhlaWdodD0iNDAiIHJ4PSI1IiByeT0iNSIgZmlsbD0iIzY0NzQ4YiIgZmlsbC1vcGFjaXR5PSIwLjciLz48dGV4dCB4PSIyMDAiIHk9IjE3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RGF0YWJhc2UgKFBvc3RncmVTUUwpPC90ZXh0PjxyZWN0IHg9IjEyMCIgeT0iMjAwIiB3aWR0aD0iMTYwIiBoZWlnaHQ9IjQwIiByeD0iNSIgcnk9IjUiIGZpbGw9IiM1MDBmOTQiIGZpbGwtb3BhY2l0eT0iMC43Ii8+PHRleHQgeD0iMjAwIiB5PSIyMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkJsb2NrY2hhaW4gKEJhc2UgTmV0d29yayk8L3RleHQ+PHRleHQgeD0iMjAwIiB5PSIyNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRlY2huaWNhbCBBcmNoaXRlY3R1cmU8L3RleHQ+PC9zdmc+",
    security: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYxNjI5Ii8+PHBhdGggZD0iTTIwMCA1MCBMMjUwIDEwMCBMMjAwIDIwMCBMMTUwIDEwMCBaIiBmaWxsPSIjMGY4NGZmIiBmaWxsLW9wYWNpdHk9IjAuNCIgc3Ryb2tlPSIjMGY4NGZmIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxMTAiIHI9IjI1IiBmaWxsPSIjMGYxNjI5IiBzdHJva2U9IiMwZjg0ZmYiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjE5MCIgeT0iOTUiIHdpZHRoPSIyMCIgaGVpZ2h0PSIzMCIgcng9IjIiIHJ5PSIyIiBmaWxsPSIjMGY4NGZmIi8+PHJlY3QgeD0iMTg1IiB5PSIxMTAiIHdpZHRoPSIzMCIgaGVpZ2h0PSI4IiByeD0iMiIgcnk9IjIiIGZpbGw9IiMwZjg0ZmYiLz48dGV4dCB4PSIxMDAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSI+QmxvY2tjaGFpbiBWZXJpZmljYXRpb248L3RleHQ+PHRleHQgeD0iMTAwIiB5PSIxNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiPkR1cGxpY2F0ZSBFbWFpbCBQcmV2ZW50aW9uPC90ZXh0Pjx0ZXh0IHg9IjEwMCIgeT0iMTkwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIj5QYXltZW50IEV4cGlyYXRpb24gSGFuZGxpbmc8L3RleHQ+PHRleHQgeD0iMjAwIiB5PSIyNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlNlY3VyaXR5IEZlYXR1cmVzPC90ZXh0Pjwvc3ZnPg==",
    flow: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYxNjI5Ii8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iNTAiIHI9IjE1IiBmaWxsPSIjMGY4NGZmIi8+PHJlY3QgeD0iMTkwIiB5PSI2NSIgd2lkdGg9IjIwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjMGY4NGZmIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTEwIiByPSIxNSIgZmlsbD0iIzIzN2ZiNiIvPjxyZWN0IHg9IjE5MCIgeT0iMTI1IiB3aWR0aD0iMjAiIGhlaWdodD0iMzAiIGZpbGw9IiMyMzdmYjYiLz48Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNzAiIHI9IjE1IiBmaWxsPSIjNTc3NmE2Ii8+PHJlY3QgeD0iMTkwIiB5PSIxODUiIHdpZHRoPSIyMCIgaGVpZ2h0PSIzMCIgZmlsbD0iIzU3NzZhNiIvPjxjaXJjbGUgY3g9IjIwMCIgY3k9IjIzMCIgcj0iMTUiIGZpbGw9IiM4M2E5ZDYiLz48dGV4dCB4PSIyMzAiIHk9IjU1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIj5DcmVhdGUgUGF5bWVudDwvdGV4dD48dGV4dCB4PSIyMzAiIHk9IjExNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSI+R2VuZXJhdGUgUVIgQ29kZTwvdGV4dD48dGV4dCB4PSIyMzAiIHk9IjE3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSI+Q3VzdG9tZXIgUGF5czwvdGV4dD48dGV4dCB4PSIyMzAiIHk9IjIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSI+VmVyaWZ5IFBheW1lbnQ8L3RleHQ+PHRleHQgeD0iMjAwIiB5PSIyNzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlRyYW5zYWN0aW9uIEZsb3c8L3RleHQ+PC9zdmc+",
    getStarted: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYxNjI5Ii8+PHJlY3QgeD0iOTAiIHk9IjUwIiB3aWR0aD0iMjIwIiBoZWlnaHQ9IjE1MCIgcng9IjEwIiByeT0iMTAiIGZpbGw9IiMxNzIxM2EiIHN0cm9rZT0iIzBmODRmZiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMjAwIiB5PSI5MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdldCBTdGFydGVkIFRvZGF5PC90ZXh0Pjx0ZXh0IHg9IjIwMCIgeT0iMTIwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SZWdpc3RlciBhdCBjcHh0Ym1pbmluZy5jb208L3RleHQ+PHRleHQgeD0iMjAwIiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNyZWF0ZSB5b3VyIGZpcnN0IHBheW1lbnQgaW4gbWludXRlczwvdGV4dD48cmVjdCB4PSIxMjAiIHk9IjE3MCIgd2lkdGg9IjE2MCIgaGVpZ2h0PSIyMCIgcng9IjUiIHJ5PSI1IiBmaWxsPSIjMGY4NGZmIi8+PHRleHQgeD0iMjAwIiB5PSIxODUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlJlZ2lzdGVyIE5vdzwvdGV4dD48dGV4dCB4PSIyMDAiIHk9IjI3MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q1BYVEIgUGF5bWVudCBQbGF0Zm9ybTwvdGV4dD48L3N2Zz4="
  };
  
  // Function to get the right image for the current slide
  const getSlideImage = (index: number) => {
    switch(index) {
      case 0: return imageUrls.platform;
      case 1: return imageUrls.overview;
      case 2: return imageUrls.merchant;
      case 3: return imageUrls.dashboard;
      case 4: return imageUrls.payment;
      case 5: return imageUrls.customer;
      case 6: return imageUrls.paypal;
      case 7: return imageUrls.architecture;
      case 8: return imageUrls.security;
      case 9: return imageUrls.flow;
      case 10: return imageUrls.getStarted;
      default: return "";
    }
  };
  
  // Function to preload all images
  useEffect(() => {
    const preloadImages = async () => {
      try {
        const imagePromises = Object.values(imageUrls).map(url => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(url);
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
          });
        });
        
        await Promise.all(imagePromises);
        setImagesLoaded(true);
      } catch (error) {
        console.error("Failed to preload images:", error);
        // If images fail to load, we'll still show the presentation without them
        setImagesLoaded(true);
      }
    };
    
    preloadImages();
  }, []);

  const slides = [
    {
      title: "CPXTB Payment Platform",
      subtitle: "Streamlined Cryptocurrency Payments for Merchants",
      content: "The simple way to accept CPXTB token payments for your business",
      icon: <Home className="h-20 w-20 text-primary" />
    },
    {
      title: "Platform Overview",
      content: [
        "Accept cryptocurrency payments in CPXTB tokens on the Base blockchain",
        "Customers can pay using their existing wallets or through PayPal integration",
        "Real-time transaction monitoring ensures payment verification",
        "Customizable payment pages to match your brand",
        "Comprehensive dashboard for payment management"
      ],
      icon: <Wallet className="h-20 w-20 text-primary" />
    },
    {
      title: "For Merchants - Getting Started",
      content: [
        "Register your business account with email or social login",
        "Connect your CPXTB wallet for receiving payments",
        "Complete your business profile",
        "Access your merchant dashboard",
        "Create your first payment request"
      ],
      icon: <CreditCard className="h-20 w-20 text-primary" />
    },
    {
      title: "Merchant Dashboard",
      content: [
        "Create new payment requests",
        "Monitor transaction history",
        "Track wallet balance",
        "Customize payment pages",
        "Generate QR codes",
        "Access API keys"
      ],
      icon: <Database className="h-20 w-20 text-primary" />
    },
    {
      title: "Creating Payment Requests",
      content: [
        "Enter payment amount in USD",
        "Add description and order ID (optional)",
        "Set expiration time",
        "Add success URL for redirecting customers",
        "Generate payment link and QR code",
        "Share with customers via email, SMS, or embed in your website"
      ],
      icon: <FileText className="h-20 w-20 text-primary" />
    },
    {
      title: "For Customers - Making Payments",
      content: [
        "Customer views payment page with merchant branding",
        "Connects wallet via social login or direct connection",
        "Scans QR code or uses direct payment button",
        "Confirms transaction in their wallet",
        "Receives real-time confirmation when payment is verified"
      ],
      icon: <QrCode className="h-20 w-20 text-primary" />
    },
    {
      title: "PayPal Integration",
      content: [
        "For customers without CPXTB tokens",
        "Purchase tokens directly within the payment flow",
        "PayPal checkout integration for familiar payment experience",
        "Tokens automatically credited to customer wallet",
        "Seamless return to the payment flow"
      ],
      icon: <CreditCard className="h-20 w-20 text-primary" />
    },
    {
      title: "Technical Architecture",
      content: [
        "Frontend: React with TypeScript, shadcn/ui components, Tailwind CSS",
        "Backend: Express.js with PostgreSQL database",
        "Blockchain: Base network integration with Web3Modal",
        "Real-time Updates: WebSocket for live payment status",
        "Security: Enhanced challenge middleware, email confirmation"
      ],
      icon: <Database className="h-20 w-20 text-primary" />
    },
    {
      title: "Security Features",
      content: [
        "Transaction validation with blockchain verification",
        "Email confirmation with database-level duplicate prevention",
        "Payment expiration handling for abandoned transactions",
        "Rate limiting to prevent abuse",
        "WebSocket security for real-time updates"
      ],
      icon: <Shield className="h-20 w-20 text-primary" />
    },
    {
      title: "Transaction Flow",
      content: [
        "Merchant creates payment request",
        "System generates payment page with QR code",
        "Customer connects wallet and initiates payment",
        "Transaction is monitored on the blockchain",
        "Payment is verified and status updated",
        "Merchant receives notification",
        "Customer sees confirmation screen"
      ],
      icon: <CheckCircle className="h-20 w-20 text-primary" />
    },
    {
      title: "Get Started Today",
      content: [
        "Register at cpxtbmining.com",
        "Create your first payment in minutes",
        "Access documentation at docs.cpxtbmining.com",
        "Contact support at support@cpxtbmining.com"
      ],
      icon: <Home className="h-20 w-20 text-primary" />
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const generatePDF = async () => {
    if (!presentationRef.current) return;
    
    setIsGeneratingPDF(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // We need to capture each slide individually
      for (let i = 0; i < slides.length; i++) {
        // Navigate to the slide
        setCurrentSlide(i);
        
        // Wait for the rendering to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!presentationRef.current) continue;
        
        try {
          const canvas = await html2canvas(presentationRef.current, {
            scale: 2,
            useCORS: true,
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 0.7);
          
          // Add new page if not the first page
          if (i > 0) {
            pdf.addPage();
          }
          
          // Calculate the proper dimensions to fit the slide on the page
          const imgWidth = pdfWidth;
          const imgHeight = canvas.height * imgWidth / canvas.width;
          
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
          
        } catch (error) {
          console.error("Error generating PDF slide:", error);
        }
      }
      
      // Save the PDF
      pdf.save('CPXTB_Platform_Presentation.pdf');
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // Show loading indicator if images aren't loaded yet
  if (!imagesLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Loading presentation...</p>
        </div>
      </div>
    );
  }

  // Render the current slide
  const renderSlideContent = () => {
    const slide = slides[currentSlide];
    const slideImage = getSlideImage(currentSlide);
    
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center">
        <div className="mb-6">
          {slide.icon}
        </div>
        <h1 className="text-3xl font-bold mb-2">{slide.title}</h1>
        {slide.subtitle && <h2 className="text-xl text-gray-600 mb-4">{slide.subtitle}</h2>}
        
        {slideImage && (
          <div className="mb-6 max-w-md overflow-hidden rounded-lg shadow-md">
            <img 
              src={slideImage} 
              alt={`Slide ${currentSlide + 1} illustration`} 
              className="w-full h-auto object-cover"
              crossOrigin="anonymous"
            />
          </div>
        )}
        
        {typeof slide.content === 'string' ? (
          <p className="text-lg mt-4">{slide.content}</p>
        ) : (
          <ul className="text-left list-disc pl-6 space-y-2 max-w-xl mx-auto mt-4">
            {slide.content.map((item, index) => (
              <li key={index} className="text-lg">{item}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header with hamburger menu */}
      <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">CPXTB Platform Presentation</h1>
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMenu}
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 py-1 border">
              <div className="px-4 py-2 text-sm text-gray-700 font-medium border-b">
                Presentation Options
              </div>
              <button 
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={generatePDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col p-4">
        <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden" ref={presentationRef}>
          {renderSlideContent()}
        </div>
        
        {/* Navigation controls */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Slide {currentSlide + 1} of {slides.length}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevSlide}
              disabled={currentSlide === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}