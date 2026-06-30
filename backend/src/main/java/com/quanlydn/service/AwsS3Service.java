package com.quanlydn.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.io.IOException;
import java.util.UUID;

@Service
public class AwsS3Service {

    private static final Logger logger = LoggerFactory.getLogger(AwsS3Service.class);

    @Autowired
    private S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    /**
     * Uploads file to S3 and returns public URL
     */
    public String uploadFile(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        String key = "uploads/" + UUID.randomUUID().toString() + fileExtension;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

        // Return the public URL
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
    }

    /**
     * Deletes a file from S3 bucket using its public URL
     */
    public void deleteFileByUrl(String fileUrl) {
        try {
            String prefix = String.format("https://%s.s3.%s.amazonaws.com/", bucketName, region);
            if (fileUrl != null && fileUrl.startsWith(prefix)) {
                String key = fileUrl.substring(prefix.length());
                DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build();
                s3Client.deleteObject(deleteObjectRequest);
                logger.info("Đã xóa file trên S3 thành công: Key={}", key);
            }
        } catch (Exception e) {
            logger.warn("Không thể xóa file trên S3: URL={}, Lỗi={}", fileUrl, e.getMessage());
        }
    }

    /**
     * Calculates the total size of all objects under the uploads/ prefix (flat calculation)
     */
    public long getTotalStorageSize() {
        try {
            ListObjectsV2Request listRequest = ListObjectsV2Request.builder()
                    .bucket(bucketName)
                    .prefix("uploads/")
                    .build();

            ListObjectsV2Response listResponse = s3Client.listObjectsV2(listRequest);
            long totalSize = 0;
            for (S3Object s3Object : listResponse.contents()) {
                totalSize += s3Object.size();
            }
            return totalSize;
        } catch (Exception e) {
            logger.error("Lỗi khi tính tổng dung lượng từ S3: {}", e.getMessage());
            return 0L;
        }
    }
}
