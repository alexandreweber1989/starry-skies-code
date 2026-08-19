import { Play, ExternalLink, Calendar, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface YoutubeVideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    type: 'service' | 'podcast';
    url: string;
    published_at: string | null;
  };
  index?: number;
}

export function YoutubeVideoCard({ video, index = 0 }: YoutubeVideoCardProps) {
  const date = video.published_at ? new Date(video.published_at).toLocaleDateString('pt-BR') : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden group border-border/40 hover:border-red-500/30 bg-card/50 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/5">
        <div className="aspect-video relative overflow-hidden bg-zinc-900">
          {video.thumbnail_url ? (
            <img 
              src={video.thumbnail_url} 
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center opacity-20">
              <Video className="h-12 w-12" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={`uppercase text-[9px] tracking-widest border-none ${
              video.type === 'service' ? 'bg-red-600' : 'bg-blue-600'
            }`}>
              {video.type === 'service' ? 'Culto' : 'Estudo'}
            </Badge>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl shadow-red-600/40 transform scale-75 group-hover:scale-100 transition-transform duration-500">
              <Play className="h-6 w-6 text-white fill-current ml-1" />
            </div>
          </div>
        </div>

        <CardHeader className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {date}
          </div>
          <CardTitle className="text-sm line-clamp-2 leading-snug group-hover:text-red-500 transition-colors h-10">
            {video.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full font-mono text-[10px] uppercase tracking-wider border-border/40 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
            asChild
          >
            <a href={video.url} target="_blank" rel="noreferrer">
              Assistir <ExternalLink className="h-3 w-3 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
